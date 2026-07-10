/* FreeNav 栏目页渲染：读取 window.__COL__ 或 ?c= 渲染对应栏目 */
(function () {
  "use strict";

  var COLS = window.FREENAV_COLUMNS || [];
  var SOFTWARE = window.FREENAV_SOFTWARE || [];
  var CATS = window.FREENAV_CATEGORIES || [];

  var PLATFORM_LABEL = {
    Win: "Windows", Mac: "macOS", Linux: "Linux",
    Web: "Web", Android: "Android", iOS: "iOS", "自托管": "自托管"
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function catLabel(key) {
    var c = CATS.filter(function (x) { return x.key === key; })[0];
    return c ? c.label : "";
  }
  function catStyle(key) {
    var c = CATS.filter(function (x) { return x.key === key; })[0];
    if (!c) return "";
    return "--cat:" + c.color + ";--cat-2:" + (c.color2 || c.color);
  }
  function getCol() {
    var key = window.__COL__ || new URLSearchParams(location.search).get("c");
    return COLS.filter(function (c) { return c.key === key; })[0] || null;
  }

  // 软件名「去标点」后比对，用于把对比表里的名字智能链到本站软件
  function stripName(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function softByName(name) {
    var n = stripName(name);
    if (!n) return null;
    for (var i = 0; i < SOFTWARE.length; i++) {
      var s = stripName(SOFTWARE[i].name);
      if (s === n || n.indexOf(s) >= 0 || s.indexOf(n) >= 0) return SOFTWARE[i];
    }
    return null;
  }

  function getPicks(col) {
    var p = col.picks || {};
    // 优先用显式 id 列表（已验证、科学筛选取）
    if (p.ids && p.ids.length) {
      var map = {};
      SOFTWARE.forEach(function (s) { map[s.id] = s; });
      return p.ids.map(function (id) { return map[id]; }).filter(Boolean);
    }
    // 兼容旧式条件筛选
    var conds = p, set = {};
    SOFTWARE.forEach(function (s) {
      var hit = false;
      if (conds.cats && conds.cats.indexOf(s.cat) >= 0) hit = true;
      if (conds.pricing && conds.pricing.indexOf(s.pricing) >= 0) hit = true;
      if (conds.tags && (s.tags || []).some(function (t) { return conds.tags.indexOf(t) >= 0; })) hit = true;
      if (hit) set[s.id] = true;
    });
    return SOFTWARE.filter(function (s) { return set[s.id]; });
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

  function cardHTML(item) {
    var priceClass = "price-" + item.pricing;
    var badges = (item.platforms || []).map(function (p) {
      return '<span class="badge">' + esc(PLATFORM_LABEL[p] || p) + "</span>";
    }).join("");
    var tags = (item.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    return (
      '<article class="card" style="' + catStyle(item.cat) + '">' +
        '<div class="card-head">' +
          logoHTML(item.name, item.url) +
          '<div class="card-name-wrap"><span class="card-name">' + esc(item.name) + "</span>" +
          '<span class="badge ' + priceClass + '">' + esc(item.pricing) + "</span></div>" +
        "</div>" +
        '<p class="card-desc">' + esc(item.desc) + "</p>" +
        '<div class="badges">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<a class="card-link" href="' + esc(item.affiliateUrl || item.url) + '" target="_blank" rel="' + (item.affiliateUrl ? "sponsored noopener noreferrer" : "noopener noreferrer") + '">访问官网 <span aria-hidden="true">→</span></a>' +
      "</article>"
    );
  }

  // 评分星条（CSS 裁切实现半星）
  function ratingHTML(rating) {
    var pct = Math.max(0, Math.min(100, (rating / 5) * 100));
    return '<span class="rating"><span class="rating-stars">' +
      '<span class="rating-fill" style="width:' + pct.toFixed(1) + '%">★★★★★</span>★★★★★' +
      '</span><span class="rating-num">' + esc(rating.toFixed(1)) + "</span></span>";
  }
  function diffClass(d) {
    if (d === "低" || d === "易") return "easy";
    if (d === "高" || d === "难") return "hard";
    return "mid";
  }

  function reviewHTML(a) {
    var pros = (a.pros || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var cons = (a.cons || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var head =
      '<div class="review-head">' +
        "<h3>" + esc(a.title) + "</h3>" +
        '<div class="review-meta">' +
          (typeof a.rating === "number" ? ratingHTML(a.rating) : "") +
          (a.difficulty ? '<span class="diff diff-' + diffClass(a.difficulty) + '">上手难度 · ' + esc(a.difficulty) + "</span>" : "") +
        "</div>" +
      "</div>";
    var fit = (a.bestFor || a.notFor) ?
      '<div class="fit">' +
        (a.bestFor ? '<div class="fit-for"><span class="fit-ico">✓</span><div><b>适合</b>' + esc(a.bestFor) + "</div></div>" : "") +
        (a.notFor ? '<div class="fit-not"><span class="fit-ico">✕</span><div><b>不适合</b>' + esc(a.notFor) + "</div></div>" : "") +
      "</div>" : "";
    var pc = (pros || cons) ?
      '<div class="pc">' +
        (pros ? '<div class="pc-col pc-pros"><h5>优点</h5><ul>' + pros + "</ul></div>" : "") +
        (cons ? '<div class="pc-col pc-cons"><h5>不足</h5><ul>' + cons + "</ul></div>" : "") +
      "</div>" : "";
    var verdict = a.verdict ? '<div class="verdict"><span class="verdict-flag">结论</span>' + esc(a.verdict) + "</div>" : "";
    return '<article class="review">' + head + fit + pc + verdict +
      '<div class="review-body">' + (a.body || "") + "</div></article>";
  }

  function render() {
    var col = getCol();
    var hero = document.getElementById("colHero");
    var cmp = document.getElementById("colCompare");
    var picks = document.getElementById("colPicks");
    var reviews = document.getElementById("colReviews");

    if (!col) {
      if (hero) hero.innerHTML = '<h1>栏目不存在</h1><p class="col-sub">请从首页「细分专题」进入。</p>';
      return;
    }

    document.title = col.title + " · FreeNav";
    var link = document.querySelector('link[rel="canonical"]');
    if (link && window.FREENAV_SITE_URL) link.href = window.FREENAV_SITE_URL + "/columns/" + col.key + ".html";
    else if (link) link.href = "https://freenav.net/columns/" + col.key + ".html";

    if (hero) {
      hero.innerHTML =
        '<nav class="crumb" aria-label="面包屑"><a href="/">FreeNav</a><span aria-hidden="true">/</span><span>' + esc(col.title) + "</span></nav>" +
        '<span class="col-badge">' + col.icon + " " + esc(col.tagline) + "</span>" +
        (col.axis ? '<span class="col-axis">' + esc(col.axis) + "</span>" : "") +
        '<h1 class="col-title">' + esc(col.title) + "</h1>" +
        '<p class="col-intro">' + esc(col.intro) + "</p>" +
        '<a class="col-back" href="/">← 返回 FreeNav 首页</a>';
    }

    // 栏目页侧边栏导航
    var sideNav = document.getElementById("sideNav");
    if (sideNav) {
      var curKey = col.key;
      var COL_COLOR_MAP = { "opensource-alt": "security", "newbie": "office", "design": "design", "local-ai": "ai" };
      function countOf(key) { return SOFTWARE.filter(function (s) { return s.cat === key; }).length; }
      var catLinks = CATS.map(function (c) {
        return '<a class="side-cat" href="/#cat-' + c.key + '" data-cat="' + c.key + '" style="' + catStyle(c.key) + '">' +
          '<span class="side-ico">' + c.icon + "</span>" +
          '<span class="side-label">' + esc(c.label) + "</span>" +
          '<span class="side-count">' + countOf(c.key) + "</span></a>";
      }).join("");
      var colLinks = COLS.map(function (c) {
        var st = catStyle(COL_COLOR_MAP[c.key] || "security");
        var isActive = c.key === curKey;
        return '<a class="side-col' + (isActive ? " active" : "") + '" href="columns/' + c.key + '.html" style="' + st + '">' +
          '<span class="side-ico">' + c.icon + "</span>" +
          '<span class="side-label">' + esc(c.title) + "</span></a>";
      }).join("");
      sideNav.innerHTML =
        '<p class="side-h">导航</p>' +
        '<div class="side-links"><a href="/"><span class="side-ico">⌂</span><span class="side-label">返回首页</span></a></div>' +
        '<p class="side-h">全部分类</p>' +
        '<div class="side-cats">' + catLinks + "</div>" +
        '<p class="side-h">其他专题</p>' +
        '<div class="side-cols">' + colLinks + "</div>";
    }

    // 页面内锚点导航（让板块布局更清晰、好跳转）
    var main = document.querySelector("main");
    if (main) {
      var nav = document.createElement("nav");
      nav.className = "col-nav";
      nav.innerHTML = '<div class="container">' +
        '<a href="#colCompare">对比表</a>' +
        '<a href="#colPicks">相关软件</a>' +
        '<a href="#colReviews">深度测评</a>' +
        '<a class="col-nav-top" href="#top">↑ 顶部</a>' +
        "</div>";
      var anchor = cmp || picks || reviews;
      if (anchor) main.insertBefore(nav, anchor);
    }

    if (cmp && col.compare && col.compare.length) {
      var rows0 = col.compare;
      var platOpts = ["all"].concat([].concat.apply([], rows0.map(function (r) {
        return String(r.platforms).split(/[·,，、]/).map(function (s) { return s.trim(); });
      })).filter(function (v, i, a) { return v && a.indexOf(v) === i; }));
      cmp.innerHTML =
        '<h2 class="col-h2" id="compare">替代 / 对标对比表</h2>' +
        '<p class="col-sub">一眼看清免费方案能替代谁、差在哪。点软件名可直达官网；点表头排序、按平台筛选。</p>' +
        '<div class="cmp-tools">' +
          '<div class="cmp-filters" id="cmpFilters">' + platOpts.map(function (f) {
            return '<button class="cmp-chip' + (f === "all" ? " active" : "") + '" data-f="' + esc(f) + '">' + esc(f === "all" ? "全部" : f) + "</button>";
          }).join("") + "</div>" +
          '<div class="cmp-sorts"><span class="cmp-sorts-label">排序</span>' +
            '<button data-sort="name">名称</button>' +
            '<button data-sort="price">价格</button>' +
            '<button data-sort="platforms">平台</button></div>' +
        "</div>" +
        '<div class="table-wrap"><table class="compare" id="cmpTable"><thead><tr>' +
        '<th data-key="name">免费 / 开源方案</th><th data-key="vs">对标（付费）</th><th data-key="price">价格</th><th data-key="platforms">平台</th><th data-key="note">适合 / 差距</th>' +
        '</tr></thead><tbody id="cmpBody"></tbody></table></div>';

      function cmpRowHTML(r) {
        var soft = softByName(r.name);
        var nameCell = soft
          ? '<a class="cmp-name" href="' + esc(soft.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.name) + "</a>"
          : esc(r.name);
        return "<tr>" +
          "<td>" + nameCell + "</td>" +
          "<td>" + esc(r.vs) + "</td>" +
          '<td class="c-price">' + esc(r.price) + "</td>" +
          "<td>" + esc(r.platforms) + "</td>" +
          "<td>" + esc(r.note) + "</td></tr>";
      }
      var cmpState = { sort: null, dir: 1, filter: "all" };
      function cmpDraw() {
        var rows = rows0.slice();
        if (cmpState.filter !== "all") {
          rows = rows.filter(function (r) {
            return String(r.platforms).split(/[·,，、]/).some(function (s) { return s.trim() === cmpState.filter; });
          });
        }
        if (cmpState.sort) {
          rows.sort(function (a, b) {
            return String(a[cmpState.sort] || "").localeCompare(String(b[cmpState.sort] || ""), "zh") * cmpState.dir;
          });
        }
        document.getElementById("cmpBody").innerHTML = rows.map(cmpRowHTML).join("") ||
          '<tr><td colspan="5" class="cmp-empty">该平台下暂无对比项</td></tr>';
      }
      var filterWrap = document.getElementById("cmpFilters");
      filterWrap.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-f]"); if (!b) return;
        cmpState.filter = b.getAttribute("data-f");
        filterWrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); cmpDraw();
      });
      var ctable = document.getElementById("cmpTable");
      ctable.querySelectorAll("th[data-key]").forEach(function (th) {
        th.setAttribute("tabindex", "0"); th.setAttribute("role", "button");
        th.setAttribute("aria-label", "按" + th.textContent + "排序");
        function toggle() {
          var k = th.getAttribute("data-key");
          if (cmpState.sort === k) cmpState.dir *= -1; else { cmpState.sort = k; cmpState.dir = 1; }
          ctable.querySelectorAll("th").forEach(function (x) { x.classList.remove("sorted", "asc", "desc"); });
          th.classList.add("sorted"); th.classList.add(cmpState.dir > 0 ? "asc" : "desc");
          cmpDraw();
        }
        th.addEventListener("click", toggle);
        th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      });
      cmpDraw();
    }

    if (picks) {
      var list = getPicks(col);
      picks.innerHTML = '<h2 class="col-h2" id="picks">本站相关软件（' + list.length + "）</h2>" +
        '<p class="col-sub">以下均为已验证的免费 / 开源工具，点击直达官网。</p>' +
        '<div class="grid">' + list.map(cardHTML).join("") + "</div>";
    }

    if (reviews && col.reviews && col.reviews.length) {
      reviews.innerHTML = '<h2 class="col-h2" id="reviews">深度测评 / 教程</h2>' +
        col.reviews.map(reviewHTML).join("");
    }

    // 结构化数据（CollectionPage + 代表测评）
    try {
      var data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: col.title,
        description: col.intro,
        url: (window.FREENAV_SITE_URL || "https://freenav.net") + "/columns/" + col.key + ".html"
      };
      if (col.reviews && col.reviews[0] && typeof col.reviews[0].rating === "number") {
        data.hasPart = {
          "@type": "Review",
          name: col.reviews[0].title,
          reviewRating: { "@type": "Rating", ratingValue: col.reviews[0].rating, bestRating: 5 }
        };
      }
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    } catch (e) {}
  }

  if (document.readyState !== "loading") render();
  else document.addEventListener("DOMContentLoaded", render);
})();
