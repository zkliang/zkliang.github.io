/* FreeNav 前端逻辑：渲染、Search、筛选、Sort、分类速览、结构化数据 */
(function () {
  "use strict";

  var CATEGORIES = window.FREENAV_CATEGORIES || [];
  var SOFTWARE = window.FREENAV_SOFTWARE || [];

  var listRoot = document.getElementById("listRoot");
  var catTabs = document.getElementById("catTabs");   // 首页已移入侧栏，可能为 null
  var catGrid = document.getElementById("catGrid");   // 同上，可能为 null
  var sideCatsEl = document.getElementById("sideCats");
  var sideColsEl = document.getElementById("sideCols");
  var searchInput = document.getElementById("search");
  var searchCount = document.getElementById("searchCount");
  var emptyState = document.getElementById("emptyState");
  var heroTags = document.getElementById("heroTags");
  var resultMeta = document.getElementById("resultMeta");
  var sortSelect = document.getElementById("sort");
  var sortLabel = document.getElementById("sortLabel");
  var listToolbar = document.getElementById("listToolbar");
  var listSection = document.getElementById("list");
  var searchClear = document.getElementById("searchClear");
  var backBtn = document.getElementById("backBtn");
  var progressBar = document.getElementById("progress");

  var activeCat = "all";   // 当前分类视图的 key
  var query = "";
  var sortMode = "default";
  var platformFilter = "all";   // 分类视图的Platform筛选
  var spy = null;          // 侧栏滚动高亮（长页用，本版未启用)
  var view = "home";       // 'home' = 功能卡片网格；'cat' = 单分类软件

  var PLATFORM_LABEL = {
    Win: "Windows", Mac: "macOS", Linux: "Linux",
    Web: "Web", Android: "Android", iOS: "iOS", "自托管": "Self-hosted", "桌面": "Desktop"
  };
  var PRICE_RANK = { "Open Source": 0, "Free": 1, "Freemium": 2 };
  var PRICE_LABEL = { "Open Source": "Open Source", "Free": "Free", "Freemium": "Freemium" };

  // ── Favorites & 个性化（localStorage，纯前端，无追踪)──
  var LS_FAV = "freenav:favs";
  var LS_INT = "freenav:interests";
  function _getArr(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
  function _setArr(key, a) { try { localStorage.setItem(key, JSON.stringify(a)); } catch (e) {} }
  function getFavs() { return _getArr(LS_FAV); }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }
  function toggleFav(id) { var a = getFavs(); var i = a.indexOf(id); if (i === -1) a.push(id); else a.splice(i, 1); _setArr(LS_FAV, a); return i === -1; }
  function getInterests() { return _getArr(LS_INT); }
  function isInterest(k) { return getInterests().indexOf(k) !== -1; }
  function toggleInterest(k) { var a = getInterests(); var i = a.indexOf(k); if (i === -1) a.push(k); else a.splice(i, 1); _setArr(LS_INT, a); return i === -1; }
  function getFavItems() { var f = getFavs(); return SOFTWARE.filter(function (i) { return f.indexOf(i.id) !== -1; }); }

  // 分类色彩映射（差异化视觉系统的数据源)
  var CAT_COLOR = {};
  CATEGORIES.forEach(function (c) { CAT_COLOR[c.key] = c; });
  function catStyle(key) {
    var c = CAT_COLOR[key];
    if (!c) return "";
    return "--cat:" + c.color + ";--cat-2:" + (c.color2 || c.color);
  }

  // 专题 → 分类色映射（用于专题卡片着色)
  var COL_COLOR = { "opensource-alt": "security", "newbie": "office", "design": "design", "local-ai": "ai", "domestic-ai": "aichina" };

  // 首页「Why FreeNav」信任区（文案真实，不夸大)
  var WHY = [
    { icon: "🔗", title: "Official site", desc: "Direct links to official sites or open-source repos — no middlemen, safer downloads." },
    { icon: "🆓", title: "Free / Open-source first", desc: "The list favors open-source and free software, cutting unnecessary subscription costs." },
    { icon: "🛡️", title: "Privacy-friendly", desc: "Just a navigation index — no tracking, no built-in ads; your browsing data stays yours." }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function catLabel(key) {
    var c = CATEGORIES.filter(function (x) { return x.key === key; })[0];
    return c ? c.label : "";
  }
  function countOf(key) { return SOFTWARE.filter(function (i) { return i.cat === key; }).length; }

  function matchItem(item, q) {
    if (!q) return true;
    var hay = (item.name + " " + item.desc + " " + item.tags.join(" ") + " " + catLabel(item.cat)).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function sortItems(arr) {
    if (sortMode === "name") return arr.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "zh"); });
    if (sortMode === "open") return arr.slice().sort(function (a, b) { return (PRICE_RANK[a.pricing] || 9) - (PRICE_RANK[b.pricing] || 9); });
    return arr;
  }

  // 从 URL 提取域名（用于 favicon 服务)
  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  // 软件 logo：本地自托管优先 → 外链兜底 → 首字母
  // 注意：不能用内联 onload/onerror（会被 CSP 的 script-src 拦截，导致 .loaded 永不添加、
  //       logo 永远停在 shimmer 占位、图片隐藏)。统一由 bindLogos() 用 addEventListener 绑定。
  function logoHTML(name, url) {
    var letter = esc((name || "?").charAt(0).toUpperCase());
    var domain = getDomain(url);
    if (!domain) return '<div class="card-logo"><span class="logo-fallback">' + letter + "</span></div>";
    var local = "/assets/icons/" + domain + ".png";
    var ddg = "https://icons.duckduckgo.com/ip3/" + domain + ".ico";
    var own = "https://" + domain + "/favicon.ico";
    // 始终优先本地自托管（同源、快、无追踪)；本地缺则 DDG（Privacy-friendly)；再不行用官网自带 favicon；去掉 Google
    var chain = [local, ddg, own];
    var rest = chain.slice(1).join("|");
    return '<div class="card-logo has-logo">' +
      '<img alt="" loading="lazy" src="' + chain[0] + '" data-f="' + rest + '">' +
      '<span class="logo-fallback" style="display:none">' + letter + "</span>" +
      "</div>";
  }

  function onLogoError(img) {
    var L = (img.dataset.f || "").split("|");
    var i = +img.dataset.i || 0;
    if (i < L.length) { img.src = L[i]; img.dataset.i = i + 1; return; }
    if (img.parentNode) {
      var fb = img.parentNode.querySelector(".logo-fallback");
      if (fb) fb.style.display = "grid";
      img.parentNode.classList.remove("has-logo");
    }
    img.remove();
  }
  function onLogoLoad(img) { if (img.parentNode) img.parentNode.classList.add("loaded"); }
  function bindLogos(root) {
    var scope = root || document;
    var imgs = scope.querySelectorAll(".card-logo img[data-f]");
    Array.prototype.forEach.call(imgs, function (img) {
      img.addEventListener("error", function () { onLogoError(img); });
      img.addEventListener("load", function () { onLogoLoad(img); });
      // 处理已缓存/已完成（事件可能早于监听器绑定)
      if (img.complete) {
        if (img.naturalWidth > 0) onLogoLoad(img);
        else onLogoError(img);
      }
      // 超时兜底：任何网络/外链不可达时，最多 3.5s 后显示首字母，绝不永久卡在 shimmer
      setTimeout(function () {
        if (img.parentNode && !img.parentNode.classList.contains("loaded")) {
          var fb = img.parentNode.querySelector(".logo-fallback");
          if (fb) fb.style.display = "grid";
          img.parentNode.classList.remove("has-logo");
          img.remove();
        }
      }, 3500);
    });
  }

  function cardHTML(item, idx) {
    var priceClass = "price-" + item.pricing;
    var badges = (item.platforms || []).map(function (p) {
      return '<span class="badge">' + esc(PLATFORM_LABEL[p] || p) + "</span>";
    }).join("");
    var tags = (item.tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    var link = item.affiliateUrl || item.url;
    var rel = item.affiliateUrl ? "sponsored noopener noreferrer" : "noopener noreferrer";
    var lic = (window.FREENAV_LICENSES && window.FREENAV_LICENSES[item.id]) || item.license;
    var licHTML = lic ? '<span class="badge lic-badge" title="License: ' + esc(lic) + '">' + esc(lic) + "</span>" : "";
    return (
      '<article class="card" style="' + catStyle(item.cat) + ";animation-delay:" + ((idx % 12) * 0.03) + 's">' +
        '<div class="card-head">' +
          logoHTML(item.name, item.url) +
          '<div class="card-name-wrap"><span class="card-name">' + esc(item.name) + "</span>" +
          '<span class="badge ' + priceClass + '">' + esc(PRICE_LABEL[item.pricing] || item.pricing) + "</span>" + licHTML + "</div>" +
          '<button class="fav-btn' + (isFav(item.id) ? " is-fav" : "") + '" data-fav="' + esc(item.id) + '" type="button" aria-pressed="' + (isFav(item.id) ? "true" : "false") + '" aria-label="Favorites ' + esc(item.name) + '" title="Favorites">★</button>' +
        "</div>" +
        '<p class="card-desc">' + esc(item.desc) + "</p>" +
        '<div class="badges">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<div class="card-actions">' +
          '<a class="card-link card-link-primary" href="' + esc(link) + '" target="_blank" rel="' + rel + '">Visit site <span aria-hidden="true">→</span></a>' +
          "" +
        '</div>' +
      "</article>"
    );
  }

  function setupSpy() {
    if (spy) spy.disconnect();
    if (!sideCatsEl || !("IntersectionObserver" in window)) return;
    var sections = listRoot.querySelectorAll(".cat-section");
    if (!sections.length) return;
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace("cat-", "");
        var link = sideCatsEl.querySelector('a[data-cat="' + id + '"]');
        if (link) {
          sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  function render() {
    var q = query.trim().toLowerCase();
    emptyState.hidden = true;

    // Search优先：跨分类全局匹配，独立于当前视图
    if (q) {
      var res = sortItems(SOFTWARE.filter(function (i) { return matchItem(i, q); }));
      if (searchCount) searchCount.textContent = res.length + " items";
      if (backBtn) backBtn.hidden = (view === "home");
      if (listToolbar) listToolbar.hidden = (view === "home");
      renderResults(res, 'Search “' + query.trim() + '” · ' + res.length + ' items');
      return;
    }

    if (view === "favs") { renderFavs(); return; }
    if (view === "home") { renderHome(); return; }
    renderCategory(activeCat);
  }

  // 首页赞助推荐位（放大版，放在内容流中更易被看到)
  function affiliateBannerHTML() {
    var items = window.FREENAV_AFFILIATE || [];
    if (!items.length) return "";
    var cards = items.map(function (it) {
      var tag = it.tag ? '<span class="home-aff-tag">' + it.tag + "</span>" : "";
      var note = it.note ? '<span class="home-aff-note">' + it.note + "</span>" : "";
      return '<a class="home-aff-card" href="' + it.url + '" target="_blank" rel="nofollow noopener sponsored">' +
               '<span class="home-aff-name">' + it.name + "</span>" +
               tag + note +
             "</a>";
    }).join("");
    return '<section class="home-sec home-affiliate">' +
             '<div class="home-aff-inner">' +
               '<p class="home-aff-title">Support FreeNav ongoing updates</p>' +
               '<p class="home-aff-hint">Buying through these links costs you nothing extra but helps cover our server and domain costs.</p>' +
               '<div class="home-aff-grid">' + cards + "</div>" +
             "</div>" +
           "</section>";
  }

  // 首页个性化区块：我的Favorites + 为你推荐（按关注场景)
  function buildPersonalSections() {
    var out = "";
    var favs = getFavItems();
    if (favs.length) {
      out += '<section class="home-sec home-favs">' +
        '<div class="sec-head"><span class="section-eyebrow">Your picks</span>' +
          '<h2 class="section-title">⭐ My Favorites <a class="home-link" href="#favs" data-view="favs">View all ' + favs.length + ' items →</a></h2></div>' +
        '<div class="grid">' + favs.slice(0, 8).map(cardHTML).join("") + "</div></section>";
    }
    var interests = getInterests();
    if (interests.length) {
      var intSet = {}; interests.forEach(function (k) { intSet[k] = 1; });
      var pool = SOFTWARE.filter(function (i) { return intSet[i.cat]; });
      pool.sort(function (a, b) {
        var fa = isFav(a.id) ? 0 : 1, fb = isFav(b.id) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return interests.indexOf(a.cat) - interests.indexOf(b.cat);
      });
      out += '<section class="home-sec home-rec">' +
        '<div class="sec-head"><span class="section-eyebrow">For you</span>' +
          '<h2 class="section-title">✨ Recommended for you <a class="home-link" href="#" id="editInterests">Adjust interests →</a></h2>' +
          '<p class="section-sub">Picked from the scenes you follow; tweak anytime via the ✨ Customize button on the home page.</p></div>' +
        '<div class="grid">' + pool.slice(0, 8).map(cardHTML).join("") + "</div></section>";
    }
    return out;
  }

  // 首页：功能分类卡片 + Deep Dives卡片（都不直接显示软件，点击各自进入)
  function renderHome() {
    platformFilter = "all";
    if (listToolbar) listToolbar.hidden = true;
    if (backBtn) backBtn.hidden = true;
    if (sortLabel) sortLabel.hidden = true;
    if (searchCount) searchCount.textContent = SOFTWARE.length + " items";
    if (resultMeta) resultMeta.textContent = "";
    var cols = window.FREENAV_COLUMNS || [];
    listRoot.innerHTML = buildPersonalSections() +
      '<section class="home-sec">' +
        '<div class="sec-head"><span class="section-eyebrow">Browse by function</span>' +
          '<h2 class="section-title">Find by Function</h2>' +
          '<p class="section-sub">' + CATEGORIES.length + ' major use cases, <b>click to view</b> corresponding tools; all free & open-source, no sign-up, not a cent.</p></div>' +
        '<div class="cat-grid">' + CATEGORIES.map(catCardHTML).join("") + "</div>" +
      "</section>" +
      affiliateBannerHTML() +
      '<section class="home-sec" id="columns">' +
        '<div class="sec-head"><span class="section-eyebrow">Deep dives</span>' +
          '<h2 class="section-title">Deep Dives</h2>' +
          '<p class="section-sub">Tired of choice paralysis? These <b>' + cols.length + ' columns</b> come with comparison tables and in-depth reviews, telling you which one to use.</p></div>' +
        '<div class="col-grid">' + cols.map(colCardHTML).join("") + "</div>" +
      "</section>" +
      '<section class="home-sec">' +
        '<div class="sec-head"><span class="section-eyebrow">Why FreeNav</span>' +
          '<h2 class="section-title">Why FreeNav</h2>' +
          '<p class="section-sub">We are not an ad-stuffed directory. We do one thing: present genuinely free, open-source tools, cleanly.</p></div>' +
        '<div class="why-grid">' + WHY.map(whyCardHTML).join("") + "</div>" +
      "</section>";
    if (spy) { spy.disconnect(); spy = null; }
    if (sideCatsEl) sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
  }

  // 分类视图：左侧分类Navigation + 右侧软件卡片（首页单栏，进入分类才有侧栏)
  function renderCategory(key) {
    var c = CAT_COLOR[key];
    if (!c) { view = "home"; renderHome(); return; }
    if (listToolbar) listToolbar.hidden = false;
    if (backBtn) backBtn.hidden = false;
    if (sortLabel) sortLabel.hidden = false;
    var items = sortItems(SOFTWARE.filter(function (i) { return i.cat === key; }));
    if (platformFilter !== "all") items = items.filter(function (i) { return (i.platforms || []).indexOf(platformFilter) !== -1; });
    var listBody = items.length
      ? '<div class="grid">' + items.map(cardHTML).join("") + "</div>"
      : '<div class="empty-state"><p>No software in this category yet</p></div>';
    if (searchCount) searchCount.textContent = items.length + " items";
    var pfLabel = platformFilter !== "all" ? " · " + (PLATFORM_LABEL[platformFilter] || platformFilter) : "";
    if (resultMeta) resultMeta.textContent = c.label + pfLabel + " · " + items.length + " items";

    var sideCats = CATEGORIES.map(function (x) {
      return '<button class="cat-side-link' + (x.key === key ? " active" : "") + '" data-cat="' + x.key + '" style="' + catStyle(x.key) + '" type="button">' +
        '<span class="csl-ico">' + x.icon + "</span>" +
        '<span class="csl-name">' + esc(x.label) + "</span>" +
        '<span class="csl-count">' + countOf(x.key) + "</span></button>";
    }).join("");
    var sideCols = (window.FREENAV_COLUMNS || []).map(function (x) {
      var st = catStyle(COL_COLOR[x.key] || "security");
      return '<a class="cat-side-link" href="/en/columns/' + x.key + '.html" style="' + st + '">' +
        '<span class="csl-ico">' + x.icon + "</span>" +
        '<span class="csl-name">' + esc(x.title) + "</span></a>";
    }).join("");

    var hasTools = SOFTWARE.some(function (i) { return i.cat === key; });
    var pfChips = "";
    if (hasTools) {
      var pfOrder = ["Win", "Mac", "Linux", "Web", "Android", "iOS", "自托管"];
      var present = {};
      SOFTWARE.filter(function (i) { return i.cat === key; }).forEach(function (i) { (i.platforms || []).forEach(function (p) { present[p] = 1; }); });
      pfChips = '<div class="cat-filters" role="group" aria-label="Filter by platform"><button class="pf-chip' + (platformFilter === "all" ? " active" : "") + '" data-pf="all" type="button">All platforms</button>' +
        pfOrder.filter(function (p) { return present[p]; }).map(function (p) {
          return '<button class="pf-chip' + (platformFilter === p ? " active" : "") + '" data-pf="' + esc(p) + '" type="button">' + esc(PLATFORM_LABEL[p] || p) + "</button>";
        }).join("") + "</div>";
    }

    listRoot.innerHTML =
      '<div class="cat-layout">' +
        '<aside class="cat-side">' +
          '<button class="cat-side-home" type="button">← All Categories</button>' +
          '<p class="cat-side-h">All Categories</p>' +
          '<div class="cat-side-list">' + sideCats + "</div>" +
          '<p class="cat-side-h">Deep Dives</p>' +
          '<div class="cat-side-list">' + sideCols + "</div>" +
        "</aside>" +
        '<div class="cat-main">' +
          '<nav class="crumb" aria-label="Breadcrumb"><a href="/">FreeNav</a><span aria-hidden="true">/</span><span>' + esc(c.label) + "</span></nav>" +
          '<div class="cat-head" style="' + catStyle(key) + '">' +
            '<span class="cat-ico">' + c.icon + "</span>" +
            "<div><h2>" + esc(c.label) + '<span class="cnt">' + items.length + " items</span></h2>" +
            '<p class="cat-desc">' + esc(c.desc) + "</p>" +
            (c.guide ? '<p class="cat-guide"><span aria-hidden="true">💡</span> ' + esc(c.guide) + "</p>" : "") +
            "</div></div>" +
          pfChips +
          listBody +
        "</div>" +
      "</div>";

    bindLogos(listRoot);

    var homeBtn = listRoot.querySelector(".cat-side-home");
    if (homeBtn) homeBtn.addEventListener("click", function () {
      view = "home"; activeCat = "all"; query = ""; platformFilter = "all";
      if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.classList.remove("show");
      render();
      if (listSection) window.scrollTo({ top: listSection.offsetTop - 70, behavior: "smooth" });
    });
  }

  function renderFavs() {
    var items = getFavItems();
    if (listToolbar) listToolbar.hidden = false;
    if (backBtn) backBtn.hidden = false;
    if (sortLabel) sortLabel.hidden = true;
    if (searchCount) searchCount.textContent = items.length + " items";
    if (resultMeta) resultMeta.textContent = "⭐ My Favorites · " + items.length + " items";
    if (spy) { spy.disconnect(); spy = null; }
    if (sideCatsEl) sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
    if (!items.length) {
      listRoot.innerHTML = '<div class="empty-state" style="display:block"><p>You have not favorited any tools yet.</p>' +
        '<p>Head back to the home page and tap the star on any card to favorite it - it stays saved locally, even across devices.</p></div>';
      return;
    }
    listRoot.innerHTML = '<div class="grid">' + items.map(cardHTML).join("") + "</div>";
    bindLogos(listRoot);
  }

  function renderResults(arr, meta) {
    if (resultMeta) resultMeta.textContent = meta;
    if (!arr.length) {
      listRoot.innerHTML = "";
      if (emptyState) {
        emptyState.innerHTML = '<p>No software matching "' + esc(query.trim()) + '" was found. Try other keywords, or browse the categories on the left.</p>';
        emptyState.hidden = false;
      }
      return;
    }
    if (spy) { spy.disconnect(); spy = null; }
    if (sideCatsEl) sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
    listRoot.innerHTML = '<div class="grid">' + arr.map(cardHTML).join("") + "</div>";
    bindLogos(listRoot);
  }

  function whyCardHTML(w) {
    return '<div class="why-card"><span class="why-ico">' + w.icon + "</span>" +
      '<h3 class="why-title">' + esc(w.title) + "</h3>" +
      '<p class="why-desc">' + esc(w.desc) + "</p></div>";
  }

  function catCardHTML(c) {
    return '<button class="cat-card" data-cat="' + c.key + '" style="' + catStyle(c.key) + '" type="button">' +
      '<span class="cat-card-ico">' + c.icon + "</span>" +
      '<span class="cat-card-name">' + esc(c.label) + '<span class="cat-card-count">' + countOf(c.key) + "</span></span>" +
      '<span class="cat-card-desc">' + esc(c.desc) + "</span>" +
      '<span class="cat-card-arrow" aria-hidden="true">→</span>' +
      "</button>";
  }

  function colCardHTML(c) {
    var style = catStyle(COL_COLOR[c.key] || "security");
    return '<a class="col-card" href="/en/columns/' + c.key + '.html" style="' + style + '">' +
      (c.axis ? '<span class="col-axis">' + esc(c.axis) + "</span>" : "") +
      '<span class="cat-card-ico">' + c.icon + "</span>" +
      '<span class="cat-card-name">' + esc(c.title) + "</span>" +
      '<span class="cat-card-desc">' + esc(c.tagline) + "</span>" +
      '<span class="col-card-go">View comparison & review →</span>' +
      "</a>";
  }

  function highlightSide(key) {
    if (!sideCatsEl) return;
    sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
    var link = sideCatsEl.querySelector('a[data-cat="' + key + '"]');
    if (link) link.classList.add("active");
  }

  // 进入某分类视图（从首页卡片或侧栏点击)
  function setCatView(key) {
    view = "cat";
    activeCat = key;
    platformFilter = "all";
    query = "";
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.classList.remove("show");
    render();
    if (listSection) window.scrollTo({ top: listSection.offsetTop - 70, behavior: "smooth" });
  }

  function renderTabs() {
    if (!catTabs) return;
    var tabs = [{ key: "all", label: "All", icon: "✨", count: SOFTWARE.length }].concat(
      CATEGORIES.map(function (c) { return { key: c.key, label: c.label, icon: c.icon, count: countOf(c.key) }; })
    );
    catTabs.innerHTML = tabs.map(function (t) {
      var cls = t.key === activeCat ? "active" : "";
      return '<button class="' + cls + '" data-cat="' + t.key + '">' +
        (t.icon ? '<span class="tab-ico">' + t.icon + "</span>" : "") +
        esc(t.label) + '<span class="tab-count">' + t.count + "</span></button>";
    }).join("");
  }

  function renderCatGrid() {
    if (!catGrid) return;
    catGrid.innerHTML = CATEGORIES.map(function (c) {
      return '<button class="cat-card" data-cat="' + c.key + '" style="' + catStyle(c.key) + '">' +
        '<span class="cat-card-ico">' + c.icon + "</span>" +
        '<span class="cat-card-name">' + esc(c.label) + '<span class="cat-card-count">' + countOf(c.key) + "</span></span>" +
        '<span class="cat-card-desc">' + esc(c.desc) + "</span>" +
        "</button>";
    }).join("");
  }

  // 左侧栏：All Categories（点击平滑滚动到对应区块)
  function renderSideCats() {
    if (!sideCatsEl) return;
    sideCatsEl.innerHTML = CATEGORIES.map(function (c) {
      return '<a class="side-cat" href="#cat-' + c.key + '" data-cat="' + c.key + '" style="' + catStyle(c.key) + '">' +
        '<span class="side-ico">' + c.icon + "</span>" +
        '<span class="side-label">' + esc(c.label) + "</span>" +
        '<span class="side-count">' + countOf(c.key) + "</span></a>";
    }).join("");
  }

  // 左侧栏：Deep Dives（跳转栏目页)
  function renderSideCols() {
    if (!sideColsEl || !window.FREENAV_COLUMNS) return;
    sideColsEl.innerHTML = window.FREENAV_COLUMNS.map(function (c) {
      var style = catStyle(COL_COLOR[c.key] || "security");
      return '<a class="side-col" href="columns/' + c.key + '.html" style="' + style + '">' +
        '<span class="side-ico">' + c.icon + "</span>" +
        '<span class="side-label">' + esc(c.title) + "</span></a>";
    }).join("");
  }

  function renderHeroTags() {
    var freq = {};
    SOFTWARE.forEach(function (i) { (i.tags || []).forEach(function (t) { freq[t] = (freq[t] || 0) + 1; }); });
    var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 8);
    heroTags.innerHTML = top.map(function (s) {
      return '<button data-q="' + esc(s) + '">#' + esc(s) + "</button>";
    }).join("");
  }

  function injectJSONLD() {
    var list = SOFTWARE.map(function (i) {
      return {
        "@type": "SoftwareApplication",
        name: i.name,
        applicationCategory: catLabel(i.cat),
        operatingSystem: (i.platforms || []).join(", "),
        url: i.url,
        description: i.desc,
        Offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" }
      };
    });
    var data = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: SOFTWARE.length,
      itemListElement: list.map(function (item, idx) {
        return { "@type": "ListItem", position: idx + 1, item: item };
      })
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // 事件：内容区功能卡片点击 → 进入该分类视图
  listRoot.addEventListener("click", function (e) {
    var favBtn = e.target.closest("button[data-fav]");
    if (favBtn) {
      var id = favBtn.getAttribute("data-fav");
      var added = toggleFav(id);
      favBtn.classList.toggle("is-fav", added);
      favBtn.setAttribute("aria-pressed", added ? "true" : "false");
      favBtn.title = added ? "Saved" : "Favorites";
      updateFavCount();
      if (view === "favs") render();   // 在Favorites视图取消Favorites时实时移除
      return;
    }
    var btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    setCatView(btn.getAttribute("data-cat"));
  });

  // 左栏分类点击 → 进入该分类视图
  if (sideCatsEl) sideCatsEl.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-cat]");
    if (!a) return;
    e.preventDefault();
    setCatView(a.getAttribute("data-cat"));
  });

  var searchTimer = null;
  searchInput.addEventListener("input", function () {
    query = searchInput.value;
    if (searchClear) searchClear.classList.toggle("show", query.length > 0);
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      render();
      var p = new URLSearchParams(location.search);
      if (query.trim()) p.set("q", query.trim()); else p.delete("q");
      var qs = p.toString();
      history.replaceState(null, "", qs ? "?" + qs : location.pathname);
    }, 180);
  });

  if (searchClear) searchClear.addEventListener("click", function () {
    searchInput.value = ""; query = ""; searchClear.classList.remove("show");
    render(); searchInput.focus();
  });

  if (sortSelect) sortSelect.addEventListener("change", function () { sortMode = sortSelect.value; render(); });

  heroTags.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-q]");
    if (!btn) return;
    searchInput.value = btn.getAttribute("data-q");
    query = searchInput.value;
    view = "home";
    if (searchClear) searchClear.classList.toggle("show", query.length > 0);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 分类页Platform筛选 chips
  listRoot.addEventListener("click", function (e) {
    var pf = e.target.closest(".pf-chip");
    if (!pf) return;
    platformFilter = pf.getAttribute("data-pf");
    renderCategory(activeCat);
  });

  if (backBtn) backBtn.addEventListener("click", function () {
    view = "home"; activeCat = "all"; query = ""; platformFilter = "all";
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.classList.remove("show");
    render();
    if (listSection) window.scrollTo({ top: listSection.offsetTop - 70, behavior: "smooth" });
  });

  // ── Favorites计数 / 兴趣定制 ──
  function updateFavCount() {
    var el = document.getElementById("favCount");
    if (!el) return;
    var n = getFavs().length;
    el.textContent = n ? String(n) : "";
    el.classList.toggle("is-empty", !n);
  }
  function renderInterestChips() {
    var el = document.getElementById("interestChips");
    if (!el) return;
    el.innerHTML = CATEGORIES.map(function (c) {
      return '<button class="int-chip' + (isInterest(c.key) ? " active" : "") + '" data-int="' + c.key + '" style="' + catStyle(c.key) + '" type="button">' + c.icon + " " + esc(c.label) + "</button>";
    }).join("");
  }
  function openInterestPanel() { var p = document.getElementById("interestPanel"); if (p) p.hidden = false; renderInterestChips(); }
  function closeInterestPanel() { var p = document.getElementById("interestPanel"); if (p) p.hidden = true; }

  // 文档级点击：首页「View allFavorites」「Adjust interests」
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[data-view="favs"]');
    if (a) {
      e.preventDefault();
      view = "favs"; query = ""; if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.classList.remove("show");
      render(); window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (e.target.closest("#editInterests")) { e.preventDefault(); openInterestPanel(); }
  });

  // Navigation「Favorites」链接
  var navFavs = document.getElementById("navFavs");
  if (navFavs) navFavs.addEventListener("click", function (e) {
    e.preventDefault();
    view = "favs"; query = ""; if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.classList.remove("show");
    render(); window.scrollTo({ top: 0, behavior: "smooth" });
  });
  // 定制按钮 / Close / 重置 / 兴趣 chip
  var customizeBtn = document.getElementById("navCustomize");
  if (customizeBtn) customizeBtn.addEventListener("click", openInterestPanel);
  var interestClose = document.getElementById("interestClose");
  if (interestClose) interestClose.addEventListener("click", closeInterestPanel);
  var interestBackdrop = document.getElementById("interestBackdrop");
  if (interestBackdrop) interestBackdrop.addEventListener("click", closeInterestPanel);
  var interestReset = document.getElementById("interestReset");
  if (interestReset) interestReset.addEventListener("click", function () { _setArr(LS_INT, []); renderInterestChips(); renderHome(); });
  var interestChips = document.getElementById("interestChips");
  if (interestChips) interestChips.addEventListener("click", function (e) {
    var chip = e.target.closest("button[data-int]"); if (!chip) return;
    toggleInterest(chip.getAttribute("data-int"));
    chip.classList.toggle("active");
    renderHome();
  });

  // 初始化
  if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();
  renderTabs();
  renderSideCats();
  renderSideCols();
  renderHeroTags();
  // URL 可ShareSearch：?q= 读取（扩展/Share链接直达Search结果)
  var _params = new URLSearchParams(location.search);
  var _q0 = _params.get("q");
  if (_q0) { query = _q0; if (searchInput) { searchInput.value = _q0; if (searchClear) searchClear.classList.add("show"); } }
  // URL 可Share分类：?cat= 读取（从栏目页侧边栏跳回首页时自动筛好该分类)
  var _cat0 = _params.get("cat");
  if (_cat0) {
    var _validCat = CATEGORIES.filter(function (x) { return x.key === _cat0; })[0];
    if (_validCat) setCatView(_cat0);
  }
  updateFavCount();
  render();
  injectJSONLD();

  // 专题卡片改由 renderHome 内联渲染（见 colCardHTML)，不再单独注入 #colGrid


  // 回到顶部 + 滚动进度条
  var toTop = document.getElementById("toTop");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (toTop) toTop.hidden = !(y > 400);
    if (progressBar) progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  onScroll();
})();
