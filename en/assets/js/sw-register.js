// FreeNav · 注册 Service Worker（PWA 可安装到手机桌面）
// 外置文件以便通过 CSP（script-src 'self'）校验；内联脚本会被 CSP 拦截导致无法安装
(function () {
  if (!("serviceWorker" in navigator)) return;
  var register = function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {
      // 注册失败不影响正常浏览
    });
  };
  if (document.readyState === "complete" || document.readyState === "interactive") {
    register();
  } else {
    window.addEventListener("load", register);
  }
})();
