/* FreeNav 新标签页逻辑（纯前端，无后端、无追踪） */
(function () {
  "use strict";
  var CATS = window.FREENAV_EXT_CATS || [];
  var TOOLS = window.FREENAV_EXT || [];

  var catLabel = {};
  var catColor = {};
  CATS.forEach(function (c) { catLabel[c.key] = c.label; catColor[c.key] = c.color; });

  var search = document.getElementById("ntSearch");
  var grid = document.getElementById("ntGrid");
  var empty = document.getElementById("ntEmpty");
  var chipsEl = document.getElementById("ntChips");
  var activeCat = "all";
  var q = "";

  function logo(url) {
    try { var d = new URL(url).hostname.replace(/^www\./, ""); return "https://icons.duckduckgo.com/ip3/" + d + ".ico"; }
    catch (e) { return ""; }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function match(t) {
    if (!q) return true;
    var hay = (t.name + " " + t.desc + " " + (t.tags || []).join(" ") + " " + (catLabel[t.cat] || "")).toLowerCase();
    return hay.indexOf(q) !== -1;
  }
  function cardHTML(t) {
    var letter = esc((t.name || "?").charAt(0).toUpperCase());
    var badges = (t.platforms || []).map(function (p) { return '<span class="nt-badge">' + esc(p) + "</span>"; }).join("");
    return '<a class="nt-card" href="' + esc(t.url) + '" target="_blank" rel="noopener noreferrer" style="--cat:' + (catColor[t.cat] || "#6d8bff") + '">' +
      '<div class="nt-card-head"><img class="nt-logo" src="' + logo(t.url) + '" alt="" loading="lazy">' +
      '<span class="nt-fallback" style="display:none">' + letter + "</span>" +
      '<span class="nt-name">' + esc(t.name) + '</span><span class="nt-price">' + esc(t.pricing) + "</span></div>" +
      '<p class="nt-desc">' + esc(t.desc) + "</p>" +
      '<div class="nt-badges">' + badges + "</div></a>";
  }
  function renderChips() {
    var html = '<button class="nt-chip' + (activeCat === "all" ? " active" : "") + '" data-cat="all">全部</button>';
    html += CATS.map(function (c) {
      return '<button class="nt-chip' + (activeCat === c.key ? " active" : "") + '" data-cat="' + c.key + '" style="--cat:' + c.color + '">' + c.icon + " " + esc(c.label) + "</button>";
    }).join("");
    chipsEl.innerHTML = html;
  }
  function render() {
    var list = TOOLS.filter(function (t) { return (activeCat === "all" || t.cat === activeCat) && match(t); });
    if (!list.length) { grid.innerHTML = ""; empty.hidden = false; return; }
    empty.hidden = true;
    grid.innerHTML = list.map(cardHTML).join("");
  }

  // 捕获阶段监听 logo 加载失败 → 显示首字母兜底（避免内联 onerror 被扩展 CSP 拦截）
  grid.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.classList && img.classList.contains("nt-logo")) {
      img.style.display = "none";
      var fb = img.parentNode.querySelector(".nt-fallback");
      if (fb) fb.style.display = "grid";
    }
  }, true);

  chipsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".nt-chip");
    if (!b) return;
    activeCat = b.getAttribute("data-cat");
    renderChips();
    render();
  });
  search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); render(); });
  search.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var term = search.value.trim();
      if (term) window.open("https://freenav.net/?q=" + encodeURIComponent(term), "_blank");
    }
  });

  renderChips();
  render();
})();
