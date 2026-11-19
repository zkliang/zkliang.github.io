/* FreeNav 场景选型器渲染逻辑（纯前端，无追踪） */
(function () {
  "use strict";
  var SCENES = window.FREENAV_SCENARIOS || [];
  var SOFTWARE = window.FREENAV_SOFTWARE || [];
  var byId = {};
  SOFTWARE.forEach(function (i) { byId[i.id] = i; });

  var scenesEl = document.getElementById("pkScenes");
  var resultEl = document.getElementById("pkResult");
  var titleEl = document.getElementById("pkTitle");
  var subEl = document.getElementById("pkSub");
  var noteEl = document.getElementById("pkNote");
  var toolsEl = document.getElementById("pkTools");
  var resetBtn = document.getElementById("pkReset");
  if (!scenesEl) return;

  var PLATFORM_LABEL = { Win: "Windows", Mac: "macOS", Linux: "Linux", Web: "Web", Android: "Android", iOS: "iOS", "自托管": "自托管" };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 渲染场景卡片
  scenesEl.innerHTML = SCENES.map(function (s, idx) {
    return '<button class="pk-scene" data-scene="' + esc(s.id) + '" type="button">' +
      '<span class="pk-scene-ico">' + esc(s.icon) + "</span>" +
      '<span class="pk-scene-body"><span class="pk-scene-title">' + esc(s.title) + "</span>" +
      '<span class="pk-scene-sub">' + esc(s.sub) + "</span></span>" +
      '<span class="pk-scene-count">' + s.tools.length + " 款" +
      '<span class="pk-scene-arr" aria-hidden="true">→</span></span>' +
      "</button>";
  }).join("");

  function toolCard(item) {
    if (!item) return "";
    var badges = (item.platforms || []).map(function (p) {
      return '<span class="pk-badge">' + esc(PLATFORM_LABEL[p] || p) + "</span>";
    }).join("");
    var link = item.url || "";
    return '<a class="pk-tool" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="pk-tool-head"><span class="pk-tool-name">' + esc(item.name) + "</span>" +
      '<span class="pk-price">' + esc(item.pricing) + "</span></span>" +
      '<span class="pk-tool-desc">' + esc(item.desc) + "</span>" +
      '<span class="pk-tool-foot"><span class="pk-badges">' + badges + "</span>" +
      '<span class="pk-tool-go">官网 →</span></span>' +
      "</a>";
  }

  function showScene(id) {
    var s = SCENES.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    titleEl.textContent = s.icon + " " + s.title;
    subEl.textContent = "推荐组合 · " + s.tools.length + " 款";
    noteEl.textContent = s.note || "";
    toolsEl.innerHTML = s.tools.map(function (tid) { return toolCard(byId[tid]); }).join("");
    resultEl.hidden = false;
    if (typeof resultEl.scrollIntoView === "function") resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    Array.prototype.forEach.call(scenesEl.querySelectorAll(".pk-scene"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-scene") === id);
    });
  }

  scenesEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".pk-scene");
    if (btn) showScene(btn.getAttribute("data-scene"));
  });
  resetBtn.addEventListener("click", function () {
    resultEl.hidden = true;
    Array.prototype.forEach.call(scenesEl.querySelectorAll(".pk-scene"), function (b) { b.classList.remove("active"); });
    if (typeof scenesEl.scrollIntoView === "function") scenesEl.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // 支持 URL ?scene=xxx 直达
  var params = new URLSearchParams(window.location.search);
  var initial = params.get("scene");
  if (initial && SCENES.some(function (x) { return x.id === initial; })) {
    showScene(initial);
  }
})();
