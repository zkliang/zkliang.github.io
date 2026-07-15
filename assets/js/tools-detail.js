/* FreeNav 详情页 · 加载本地图标、兜底首字母、隐藏 shimmer */
(function () {
  "use strict";

  function bindLogo(img) {
    if (!img) return;
    function loaded() {
      img.classList.add("loaded");
      img.parentNode && img.parentNode.classList.add("loaded");
    }
    function failed() {
      img.classList.add("error");
      img.parentNode && img.parentNode.classList.add("error");
      var fb = img.parentNode && img.parentNode.querySelector(".logo-fallback");
      if (fb) fb.style.display = "grid";
    }

    if (img.complete) {
      if (img.naturalWidth > 0) loaded();
      else failed();
    } else {
      img.addEventListener("load", loaded);
      img.addEventListener("error", failed);
    }
  }

  // 详情页主图标 + 同类推荐卡片图标
  document.querySelectorAll(".tool-logo img, .card-logo img").forEach(bindLogo);
})();
