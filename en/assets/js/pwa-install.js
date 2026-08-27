/* FreeNav · PWA Add to Home Screen引导（Add to Home Screen)
 *  - Android/Chrome：拦截 beforeinstallprompt，弹出系统安装提示
 *  - iOS/Safari、WeChat内置浏览器、或其他未触发原生 prompt 的情况：
 *    弹出「手动Add to Home Screen」图文步骤（按Platform区分)
 *  - 已安装 / 已Close / 桌面端：自动隐藏
 *  关键修复：兜底弹出的 banner 按钮不再「点了没反应」——
 *    有 deferredPrompt 就真装，没有就弹对应Platform的手动步骤。
 */
(function () {
  "use strict";

  var STORE_KEY = "freenav-install-dismissed";
  var bannerCreated = false;
  var deferredPrompt = null;

  // 已在 PWA 独立模式：不显示任何引导
  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) return;

  // 用户曾Close过：不显示
  try {
    if (localStorage.getItem(STORE_KEY) === "1") return;
  } catch (e) {}

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  var isAndroid = /Android/i.test(ua);
  var isWeChat = /MicroMessenger/i.test(ua);
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || isWeChat;

  // 桌面端不显示（桌面 Chrome 有自己的安装提示，无需重复)
  if (!isMobile) return;

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]);
    });
  }

  function openGuide() {
    if (document.getElementById("pwaInstallGuide")) return;
    var steps;
    if (isWeChat) {
      steps =
        '<li>Tap the top-right corner <strong>···</strong></li>' +
        '<li>Choose <strong>Open in browser</strong></li>' +
        '<li>Then in your system browser, follow the steps below:</li>' +
        (isIOS
          ? '<li>iOS: tap <strong>Share</strong> at the bottom → <strong>Add to Home Screen</strong> → <strong>Add</strong></li>'
          : '<li>Android: top-right <strong>⋮</strong> → <strong>Add to Home Screen</strong></li>');
    } else if (isIOS) {
      steps =
        '<li>Tap the <strong>Share</strong> icon in the bottom toolbar <span class="pwa-share-icon" aria-hidden="true">⎙</span></li>' +
        '<li>Swipe up and tap <strong>Add to Home Screen</strong></li>' +
        '<li>Tap <strong>Add</strong> at the top-right</li>';
    } else {
      steps =
        '<li>Tap the <strong>⋮ menu</strong> at the top-right of the browser</li>' +
        '<li>Choose <strong>Add to Home Screen</strong></li>' +
        '<li>In the popup, tap <strong>Add to Home Screen</strong></li>';
    }

    var overlay = document.createElement("div");
    overlay.id = "pwaInstallGuide";
    overlay.className = "pwa-install-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Add to Home Screen");
    overlay.innerHTML =
      '<div class="pwa-install-modal">' +
        '<h3>Add to Home Screen</h3>' +
        '<p>Put FreeNav on your home screen and open it like an app:</p>' +
        '<ol>' + steps + '</ol>' +
        '<button class="pwa-install-modal-close" type="button">Got it</button>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.querySelector(".pwa-install-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  }

  function buildBanner() {
    if (bannerCreated) return;
    bannerCreated = true;
    if (document.getElementById("pwaInstallBanner")) return;

    var banner = document.createElement("div");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Add to Home Screen");
    // 按钮文案随是否拿到原生 prompt 变化：能装→「安装」，否则→「Add to Home Screen」
    var btnLabel = "Add to Home Screen";
    banner.innerHTML =
      '<div class="pwa-install-inner">' +
        '<span class="pwa-install-icon" aria-hidden="true">📲</span>' +
        '<span class="pwa-install-text">Add to Home Screen, use it like an app</span>' +
        '<button class="pwa-install-btn" type="button">' + esc(btnLabel) + '</button>' +
        '<button class="pwa-install-close" type="button" aria-label="Close">×</button>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector(".pwa-install-btn").addEventListener("click", function () {
      if (deferredPrompt && typeof deferredPrompt.prompt === "function") {
        // 真实安装：调用系统安装弹窗
        deferredPrompt.prompt();
        var choice = deferredPrompt.userChoice;
        if (choice && typeof choice.then === "function") {
          choice.then(function (res) {
            if (res && res.outcome === "accepted") banner.remove();
            deferredPrompt = null;
          }).catch(function () { deferredPrompt = null; });
        } else {
          deferredPrompt = null;
        }
      } else {
        // 兜底：弹对应Platform的手动添加步骤
        openGuide();
      }
    });

    banner.querySelector(".pwa-install-close").addEventListener("click", function () {
      banner.remove();
      try { localStorage.setItem(STORE_KEY, "1"); } catch (e) {}
    });
  }

  // 原生安装提示可用：捕获并改为我们自己的按钮触发
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // 若兜底 banner 已先弹出，把按钮文案切到「安装」
    var btn = document.querySelector("#pwaInstallBanner .pwa-install-btn");
    if (btn) {
      btn.textContent = "Add to Home Screen";
    } else {
      buildBanner();
    }
  });

  // 兜底：移动端一律在 1.8s 后展示引导（无论是否拿到原生 prompt，按钮都可用)
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(buildBanner, 1800);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(buildBanner, 1800);
    });
  }
})();
