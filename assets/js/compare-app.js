/* FreeNav 工具对比页：选择 2-4 款工具，横向对比关键维度（纯前端） */
(function () {
  "use strict";
  var SOFTWARE = window.FREENAV_SOFTWARE || [];
  var CATEGORIES = window.FREENAV_CATEGORIES || [];
  var byId = {};
  SOFTWARE.forEach(function (i) { byId[i.id] = i; });
  var catLabel = {};
  CATEGORIES.forEach(function (c) { catLabel[c.key] = c.label; });

  var pickEl = document.getElementById("cmpPick");
  var tableWrap = document.getElementById("cmpTableWrap");
  var emptyEl = document.getElementById("cmpEmpty");
  if (!pickEl) return;

  var selected = [];
  var MAX = 4;
  var PLATFORM_LABEL = { Win: "Windows", Mac: "macOS", Linux: "Linux", Web: "Web", Android: "Android", iOS: "iOS", "自托管": "自托管" };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 选择器：按分类分组的 <select>
  var groups = {};
  SOFTWARE.forEach(function (i) { (groups[i.cat] = groups[i.cat] || []).push(i); });
  var opts = '<option value="">+ 添加一款工具…</option>';
  Object.keys(groups).forEach(function (k) {
    opts += '<optgroup label="' + esc(catLabel[k] || k) + '">';
    groups[k].forEach(function (i) { opts += '<option value="' + esc(i.id) + '">' + esc(i.name) + "</option>"; });
    opts += "</optgroup>";
  });
  pickEl.innerHTML = opts;

  function rows() {
    return [
      { label: "官网", get: function (i) { return '<a href="' + esc(i.url) + '" target="_blank" rel="noopener noreferrer">访问 →</a>'; } },
      { label: "授权 / 价格", get: function (i) { return esc(i.pricing); } },
      { label: "支持平台", get: function (i) { return (i.platforms || []).map(function (p) { return esc(PLATFORM_LABEL[p] || p); }).join(" · "); } },
      { label: "分类", get: function (i) { return esc(catLabel[i.cat] || i.cat); } },
      { label: "标签", get: function (i) { return (i.tags || []).map(function (t) { return '<span class="cmp-tag">' + esc(t) + "</span>"; }).join(" "); } },
      { label: "简介", get: function (i) { return esc(i.desc); } }
    ];
  }

  function render() {
    if (selected.length < 2) {
      tableWrap.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    tableWrap.hidden = false;
    var items = selected.map(function (id) { return byId[id]; }).filter(Boolean);
    var head = '<div class="cmp-row cmp-head-row"><div class="cmp-cell cmp-label">对比项</div>' +
      items.map(function (i) { return '<div class="cmp-cell cmp-col-head"><span class="cmp-col-name">' + esc(i.name) + "</span>" +
        '<button class="cmp-remove" data-remove="' + esc(i.id) + '" type="button" aria-label="移除">×</button></div>'; }).join("") + "</div>";
    var body = rows().map(function (r) {
      return '<div class="cmp-row"><div class="cmp-cell cmp-label">' + esc(r.label) + "</div>" +
        items.map(function (i) { return '<div class="cmp-cell">' + r.get(i) + "</div>"; }).join("") + "</div>";
    }).join("");
    tableWrap.innerHTML = head + body;
    renderChips();
  }

  function renderChips() {
    var chipWrap = document.getElementById("cmpChips");
    if (!chipWrap) return;
    chipWrap.innerHTML = selected.map(function (id) {
      return '<span class="cmp-chip-active">' + esc(byId[id] ? byId[id].name : id) +
        '<button data-remove="' + esc(id) + '" type="button" aria-label="移除">×</button></span>';
    }).join("");
  }

  pickEl.addEventListener("change", function () {
    var id = pickEl.value;
    if (!id) return;
    if (selected.indexOf(id) === -1 && selected.length < MAX) selected.push(id);
    pickEl.value = "";
    render();
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (!btn) return;
    var id = btn.getAttribute("data-remove");
    selected = selected.filter(function (x) { return x !== id; });
    render();
  });

  // URL ?ids=a,b,c 预选
  var params = new URLSearchParams(window.location.search);
  var ids = (params.get("ids") || "").split(",").filter(function (x) { return byId[x]; }).slice(0, MAX);
  ids.forEach(function (id) { if (selected.indexOf(id) === -1) selected.push(id); });
  if (selected.length) render();
})();
