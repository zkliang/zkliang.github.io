/* FreeNav · PWA 添加到主屏幕引导（Add to Home Screen）
 *  - Android/Chrome：拦截 beforeinstallprompt，弹出系统安装提示
 *  - iOS/Safari：无原生 prompt，显示手动操作引导
 *  - 已安装 / 已关闭 / 不支持时自动隐藏
 */
(function () {
  "use strict";

  var STORE_KEY = "freenav-install-dismissed";
  var bannerCreated = false;
  var deferredPrompt = null;

  // 已在 PWA 独立模式：不显示任何引导
  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) return;

  // 用户曾关闭过：不显示
  try {
    if (localStorage.getItem(STORE_KEY) === "1") return;
  } catch (e) {}

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]);
    });
  }

  function createBanner() {
    if (bannerCreated) return;
    bannerCreated = true;
    if (document.getElementById("pwaInstallBanner")) return;

    var banner = document.createElement("div");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "添加到主屏幕");
    banner.innerHTML =
      '<div class="pwa-install-inner">' +
        '<span class="pwa-install-icon" aria-hidden="true">📲</span>' +
        '<span class="pwa-install-text">添加到主屏幕，像 App 一样使用</span>' +
        '<button class="pwa-install-btn" type="button">安装</button>' +
        '<button class="pwa-install-close" type="button" aria-label="关闭">×</button>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector(".pwa-install-btn").addEventListener("click", function () {
      if (deferredPrompt && typeof deferredPrompt.prompt === "function") {
        deferredPrompt.prompt();
        var choice = deferredPrompt.userChoice;
        if (choice && typeof choice.then === "function") {
          choice.then(function (res) {
            if (res && res.outcome === "accepted") banner.remove();
            deferredPrompt = null;
          }).catch(function () {
            deferredPrompt = null;
          });
        } else {
          deferredPrompt = null;
        }
      } else if (isIOS || isSafari) {
        showIOSGuide();
      }
    });

    banner.querySelector(".pwa-install-close").addEventListener("click", function () {
      banner.remove();
      try { localStorage.setItem(STORE_KEY, "1"); } catch (e) {}
    });
  }

  function showIOSGuide() {
    if (document.getElementById("pwaInstallGuide")) return;
    var overlay = document.createElement("div");
    overlay.id = "pwaInstallGuide";
    overlay.className = "pwa-install-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "添加到主屏幕");
    overlay.innerHTML =
      '<div class="pwa-install-modal">' +
        '<h3>添加到主屏幕</h3>' +
        '<p>请按以下步骤将 FreeNav 添加到主屏幕：</p>' +
        '<ol>' +
          '<li>点击 Safari 底部的 <strong>分享</strong> 按钮 <span class="pwa-share-icon" aria-hidden="true">⎙</span></li>' +
          '<li>选择 <strong>添加到主屏幕</strong></li>' +
          '<li>点击右上角 <strong>添加</strong></li>' +
        '</ol>' +
        '<button class="pwa-install-modal-close" type="button">知道了</button>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.querySelector(".pwa-install-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  }

  // Android/Chrome 等支持 beforeinstallprompt 的浏览器
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    createBanner();
  });

  // iOS / 无原生 prompt 的移动浏览器：延迟展示手动引导入口
  if (!deferredPrompt && isMobile) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(createBanner, 1800);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(createBanner, 1800);
      });
    }
  }
})();
