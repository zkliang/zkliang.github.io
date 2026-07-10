/* FreeNav 前端逻辑：渲染、搜索、筛选、排序、分类速览、结构化数据 */
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
  var heroStats = document.getElementById("heroStats");
  var affiliateStrip = document.getElementById("affiliateStrip");
  var resultMeta = document.getElementById("resultMeta");
  var sortSelect = document.getElementById("sort");
  var sortLabel = document.getElementById("sortLabel");
  var listSection = document.getElementById("list");
  var searchClear = document.getElementById("searchClear");
  var backBtn = document.getElementById("backBtn");
  var progressBar = document.getElementById("progress");

  var activeCat = "all";   // 当前分类视图的 key
  var query = "";
  var sortMode = "default";
  var platformFilter = "all";   // 分类视图的平台筛选
  var spy = null;          // 侧栏滚动高亮（长页用，本版未启用）
  var view = "home";       // 'home' = 功能卡片网格；'cat' = 单分类软件

  var PLATFORM_LABEL = {
    Win: "Windows", Mac: "macOS", Linux: "Linux",
    Web: "Web", Android: "Android", iOS: "iOS", "自托管": "自托管"
  };
  var PRICE_RANK = { "开源": 0, "免费": 1, "免费增值": 2 };
  var PRICE_LABEL = { "开源": "开源", "免费": "免费", "免费增值": "免费增值" };

  // 分类色彩映射（差异化视觉系统的数据源）
  var CAT_COLOR = {};
  CATEGORIES.forEach(function (c) { CAT_COLOR[c.key] = c; });
  function catStyle(key) {
    var c = CAT_COLOR[key];
    if (!c) return "";
    return "--cat:" + c.color + ";--cat-2:" + (c.color2 || c.color);
  }

  // 专题 → 分类色映射（用于专题卡片着色）
  var COL_COLOR = { "opensource-alt": "security", "newbie": "office", "design": "design", "local-ai": "ai" };

  // 首页「为什么选择 FreeNav」信任区（文案真实，不夸大）
  var WHY = [
    { icon: "🔗", title: "官网直达", desc: "每款工具直链官方网站或开源仓库，没有中间商，下载更安心。" },
    { icon: "🆓", title: "免费 / 开源优先", desc: "清单以开源与免费软件为主，告别流氓捆绑与昂贵订阅。" },
    { icon: "🛡️", title: "隐私友好", desc: "只做导航索引，不追踪、不内置广告，你的浏览数据只属于你。" }
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

  // 从 URL 提取域名（用于 favicon 服务）
  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  // 软件 logo：本地自托管优先 → 外链兜底 → 首字母
  function logoHTML(name, url) {
    var letter = esc((name || "?").charAt(0).toUpperCase());
    var domain = getDomain(url);
    if (!domain) return '<div class="card-logo"><span class="logo-fallback">' + letter + "</span></div>";
    var hasLocal = window.FREENAV_ICONS && window.FREENAV_ICONS[domain];
    var local = hasLocal ? "/assets/icons/" + domain + ".png" : null;
    var own = "https://" + domain + "/favicon.ico";
    var ddg = "https://icons.duckduckgo.com/ip3/" + domain + ".ico";
    var ggl = "https://www.google.com/s2/favicons?domain=" + domain;
    var chain = (local ? [local, own, ddg, ggl] : [own, ddg, ggl]);
    var rest = chain.slice(1).join("|");
    return '<div class="card-logo has-logo">' +
      '<img alt="" loading="lazy" src="' + chain[0] + '" data-f="' + rest + '" ' +
      "onload=\"this.parentNode.classList.add('loaded')\" " +
      "onerror=\"var t=this;var L=t.dataset.f.split('|');if(!t.dataset.i)t.dataset.i=0;var i=+t.dataset.i;if(i<L.length){t.src=L[i];t.dataset.i=i+1;}else{t.remove();var s=t.parentNode.querySelector('.logo-fallback');if(s)s.style.display='grid';t.parentNode.classList.remove('has-logo');}\" />" +
      '<span class="logo-fallback" style="display:none">' + letter + "</span>" +
      "</div>";
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
    return (
      '<article class="card" style="' + catStyle(item.cat) + ";animation-delay:" + ((idx % 12) * 0.03) + 's">' +
        '<div class="card-head">' +
          logoHTML(item.name, item.url) +
          '<div class="card-name-wrap"><span class="card-name">' + esc(item.name) + "</span>" +
          '<span class="badge ' + priceClass + '">' + esc(PRICE_LABEL[item.pricing] || item.pricing) + "</span></div>" +
        "</div>" +
        '<p class="card-desc">' + esc(item.desc) + "</p>" +
        '<div class="badges">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<a class="card-link" href="' + esc(link) + '" target="_blank" rel="' + rel + '">访问官网 <span aria-hidden="true">→</span></a>' +
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

    // 搜索优先：跨分类全局匹配，独立于当前视图
    if (q) {
      var res = sortItems(SOFTWARE.filter(function (i) { return matchItem(i, q); }));
      if (searchCount) searchCount.textContent = res.length + " 款";
      if (backBtn) backBtn.hidden = (view === "home");
      renderResults(res, '搜索 “' + query.trim() + '” · 共 ' + res.length + ' 款');
      return;
    }

    if (view === "home") { renderHome(); return; }
    renderCategory(activeCat);
  }

  // 首页：功能分类卡片 + 细分专题卡片（都不直接显示软件，点击各自进入）
  function renderHome() {
    platformFilter = "all";
    if (backBtn) backBtn.hidden = true;
    if (sortLabel) sortLabel.hidden = true;
    if (searchCount) searchCount.textContent = SOFTWARE.length + " 款";
    if (resultMeta) resultMeta.textContent = CATEGORIES.length + " 大分类 · " + SOFTWARE.length + " 款免费软件";
    var cols = window.FREENAV_COLUMNS || [];
    listRoot.innerHTML =
      '<section class="home-sec">' +
        '<div class="sec-head"><span class="section-eyebrow">Browse by function</span>' +
          '<h2 class="section-title">按功能找软件</h2>' +
          '<p class="section-sub">' + CATEGORIES.length + ' 大使用场景，<b>点开即看</b>对应工具；全部免费、开源，无需注册、不收一分钱。</p></div>' +
        '<div class="cat-grid">' + CATEGORIES.map(catCardHTML).join("") + "</div>" +
      "</section>" +
      '<section class="home-sec">' +
        '<div class="sec-head"><span class="section-eyebrow">Deep dives</span>' +
          '<h2 class="section-title">细分专题</h2>' +
          '<p class="section-sub">不想被选择困难症折磨？这 <b>4 个专题</b>自带对比表与深度测评，直接告诉你该用哪个。</p></div>' +
        '<div class="col-grid">' + cols.map(colCardHTML).join("") + "</div>" +
      "</section>" +
      '<section class="home-sec">' +
        '<div class="sec-head"><span class="section-eyebrow">Why FreeNav</span>' +
          '<h2 class="section-title">为什么选择 FreeNav</h2>' +
          '<p class="section-sub">不是又一个广告导航站——我们只做一件事：把真正免费、开源的好工具，干净地交到你手里。</p></div>' +
        '<div class="why-grid">' + WHY.map(whyCardHTML).join("") + "</div>" +
      "</section>";
    if (spy) { spy.disconnect(); spy = null; }
    if (sideCatsEl) sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
  }

  // 分类视图：左侧分类导航 + 右侧软件卡片（首页单栏，进入分类才有侧栏）
  function renderCategory(key) {
    var c = CAT_COLOR[key];
    if (!c) { view = "home"; renderHome(); return; }
    if (backBtn) backBtn.hidden = false;
    if (sortLabel) sortLabel.hidden = false;
    var items = sortItems(SOFTWARE.filter(function (i) { return i.cat === key; }));
    if (platformFilter !== "all") items = items.filter(function (i) { return (i.platforms || []).indexOf(platformFilter) !== -1; });
    var listBody = items.length
      ? '<div class="grid">' + items.map(cardHTML).join("") + "</div>"
      : '<div class="empty-state"><p>该分类暂无软件</p></div>';
    if (searchCount) searchCount.textContent = items.length + " 款";
    var pfLabel = platformFilter !== "all" ? " · " + (PLATFORM_LABEL[platformFilter] || platformFilter) : "";
    if (resultMeta) resultMeta.textContent = c.label + pfLabel + " · 共 " + items.length + " 款";

    var sideCats = CATEGORIES.map(function (x) {
      return '<button class="cat-side-link' + (x.key === key ? " active" : "") + '" data-cat="' + x.key + '" style="' + catStyle(x.key) + '" type="button">' +
        '<span class="csl-ico">' + x.icon + "</span>" +
        '<span class="csl-name">' + esc(x.label) + "</span>" +
        '<span class="csl-count">' + countOf(x.key) + "</span></button>";
    }).join("");
    var sideCols = (window.FREENAV_COLUMNS || []).map(function (x) {
      var st = catStyle(COL_COLOR[x.key] || "security");
      return '<a class="cat-side-link" href="columns/' + x.key + '.html" style="' + st + '">' +
        '<span class="csl-ico">' + x.icon + "</span>" +
        '<span class="csl-name">' + esc(x.title) + "</span></a>";
    }).join("");

    var hasTools = SOFTWARE.some(function (i) { return i.cat === key; });
    var pfChips = "";
    if (hasTools) {
      var pfOrder = ["Win", "Mac", "Linux", "Web", "Android", "iOS", "自托管"];
      var present = {};
      SOFTWARE.filter(function (i) { return i.cat === key; }).forEach(function (i) { (i.platforms || []).forEach(function (p) { present[p] = 1; }); });
      pfChips = '<div class="cat-filters" role="group" aria-label="按平台筛选"><button class="pf-chip' + (platformFilter === "all" ? " active" : "") + '" data-pf="all" type="button">全部平台</button>' +
        pfOrder.filter(function (p) { return present[p]; }).map(function (p) {
          return '<button class="pf-chip' + (platformFilter === p ? " active" : "") + '" data-pf="' + esc(p) + '" type="button">' + esc(PLATFORM_LABEL[p] || p) + "</button>";
        }).join("") + "</div>";
    }

    listRoot.innerHTML =
      '<div class="cat-layout">' +
        '<aside class="cat-side">' +
          '<button class="cat-side-home" type="button">← 全部分类</button>' +
          '<p class="cat-side-h">全部分类</p>' +
          '<div class="cat-side-list">' + sideCats + "</div>" +
          '<p class="cat-side-h">细分专题</p>' +
          '<div class="cat-side-list">' + sideCols + "</div>" +
        "</aside>" +
        '<div class="cat-main">' +
          '<nav class="crumb" aria-label="面包屑"><a href="/">FreeNav</a><span aria-hidden="true">/</span><span>' + esc(c.label) + "</span></nav>" +
          '<div class="cat-head" style="' + catStyle(key) + '">' +
            '<span class="cat-ico">' + c.icon + "</span>" +
            "<div><h2>" + esc(c.label) + '<span class="cnt">' + items.length + " 款</span></h2>" +
            '<p class="cat-desc">' + esc(c.desc) + "</p>" +
            (c.guide ? '<p class="cat-guide"><span aria-hidden="true">💡</span> ' + esc(c.guide) + "</p>" : "") +
            "</div></div>" +
          pfChips +
          listBody +
        "</div>" +
      "</div>";

    var homeBtn = listRoot.querySelector(".cat-side-home");
    if (homeBtn) homeBtn.addEventListener("click", function () {
      view = "home"; activeCat = "all"; query = ""; platformFilter = "all";
      if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.classList.remove("show");
      render();
      if (listSection) window.scrollTo({ top: listSection.offsetTop - 70, behavior: "smooth" });
    });
  }

  function renderResults(arr, meta) {
    if (resultMeta) resultMeta.textContent = meta;
    if (!arr.length) {
      listRoot.innerHTML = "";
      if (emptyState) {
        emptyState.innerHTML = '<p>没有找到与“' + esc(query.trim()) + '”匹配的软件。<br>换个关键词，或浏览左侧分类试试～</p>';
        emptyState.hidden = false;
      }
      return;
    }
    if (spy) { spy.disconnect(); spy = null; }
    if (sideCatsEl) sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
    listRoot.innerHTML = '<div class="grid">' + arr.map(cardHTML).join("") + "</div>";
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
    return '<a class="col-card" href="columns/' + c.key + '.html" style="' + style + '">' +
      (c.axis ? '<span class="col-axis">' + esc(c.axis) + "</span>" : "") +
      '<span class="cat-card-ico">' + c.icon + "</span>" +
      '<span class="cat-card-name">' + esc(c.title) + "</span>" +
      '<span class="cat-card-desc">' + esc(c.tagline) + "</span>" +
      '<span class="col-card-go">查看对比表 + 测评 →</span>' +
      "</a>";
  }

  function highlightSide(key) {
    if (!sideCatsEl) return;
    sideCatsEl.querySelectorAll(".side-cat.active").forEach(function (n) { n.classList.remove("active"); });
    var link = sideCatsEl.querySelector('a[data-cat="' + key + '"]');
    if (link) link.classList.add("active");
  }

  // 进入某分类视图（从首页卡片或侧栏点击）
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
    var tabs = [{ key: "all", label: "全部", icon: "✨", count: SOFTWARE.length }].concat(
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

  // 左侧栏：全部分类（点击平滑滚动到对应区块）
  function renderSideCats() {
    if (!sideCatsEl) return;
    sideCatsEl.innerHTML = CATEGORIES.map(function (c) {
      return '<a class="side-cat" href="#cat-' + c.key + '" data-cat="' + c.key + '" style="' + catStyle(c.key) + '">' +
        '<span class="side-ico">' + c.icon + "</span>" +
        '<span class="side-label">' + esc(c.label) + "</span>" +
        '<span class="side-count">' + countOf(c.key) + "</span></a>";
    }).join("");
  }

  // 左侧栏：细分专题（跳转栏目页）
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

  function renderHeroStats() {
    if (!heroStats) return;
    var stats = [
      { num: SOFTWARE.length, label: "精选工具" },
      { num: CATEGORIES.length, label: "专业分类" },
      { num: "0¥", label: "完全免费" }
    ];
    heroStats.innerHTML = stats.map(function (s) {
      return '<div class="hero-stat"><span class="hs-num">' + s.num + '</span><span class="hs-label">' + s.label + "</span></div>";
    }).join("");
  }

  // CPS 编辑推荐位：读取 config.js 的 FREENAV_AFFILIATE，空数组则不显示
  function renderAffiliate() {
    if (!affiliateStrip) return;
    var items = window.FREENAV_AFFILIATE || [];
    if (!items.length) { affiliateStrip.hidden = true; return; }
    affiliateStrip.hidden = false;
    affiliateStrip.innerHTML =
      '<h2 class="aff-title">编辑推荐 <span class="aff-sub">精挑细选，按需入手</span></h2>' +
      '<div class="aff-grid">' + items.map(function (it) {
        var tag = it.tag ? '<span class="aff-tag">' + it.tag + "</span>" : "";
        var note = it.note ? '<p class="aff-note">' + it.note + "</p>" : "";
        return '<a class="aff-card" href="' + it.url + '" target="_blank" rel="nofollow noopener sponsored">' +
                 '<span class="aff-name">' + it.name + "</span>" + tag + note +
               "</a>";
      }).join("") + "</div>";
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
    searchTimer = setTimeout(render, 180);
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

  // 分类页平台筛选 chips
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

  // 初始化
  if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();
  renderTabs();
  renderSideCats();
  renderSideCols();
  renderHeroTags();
  renderHeroStats();
  renderAffiliate();
  render();
  injectJSONLD();

  // 专题卡片改由 renderHome 内联渲染（见 colCardHTML），不再单独注入 #colGrid


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
