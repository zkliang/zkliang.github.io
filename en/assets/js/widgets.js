/* FreeNav 增强组件：捐赠二维码展开 / Share栏 / 主题按钮提示 / 页脚紧凑化 */
(function () {
  "use strict";

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); resolve(); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("shareToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "shareToast";
      t.className = "share-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* 把统计行移入 footer-bottom，与版权信息合并在一行 */
  function compactFooterBottom() {
    var footer = document.querySelector(".site-footer");
    var bottom = document.querySelector(".site-footer .footer-bottom");
    var stat = document.querySelector(".site-footer .footer-stat");
    if (!footer || !bottom || !stat) return;
    if (bottom.contains(stat)) return;
    bottom.appendChild(stat);
  }

  /* 捐赠二维码：点击按钮显示/隐藏对应二维码 */
  function initDonate() {
    var boxes = document.querySelectorAll(".donate-box");
    boxes.forEach(function (box) {
      var buttons = box.querySelectorAll(".donate-link");
      var qrs = box.querySelectorAll(".donate-qr");
      if (!buttons.length) return;

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-qr");
          var isPressed = btn.getAttribute("aria-pressed") === "true";

          // 先重置所有按钮与二维码
          buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          qrs.forEach(function (q) { q.classList.remove("active"); });

          // 如果当前未展开，则展开；否则All收起
          if (!isPressed) {
            btn.setAttribute("aria-pressed", "true");
            var target = box.querySelector('.donate-qr[data-qr="' + key + '"]');
            if (target) target.classList.add("active");
          }
        });
      });

      // 点击外部或 Esc 收起二维码
      document.addEventListener("click", function (e) {
        if (!box.contains(e.target)) {
          buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          qrs.forEach(function (q) { q.classList.remove("active"); });
        }
      });
      box.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          qrs.forEach(function (q) { q.classList.remove("active"); });
        }
      });
    });
  }

  /* 把Share栏注入到第一个 footer-col 中，避免独立横幅占用空间 */
  function injectShareBar() {
    var footerCol = document.querySelector(".site-footer .footer-col");
    if (!footerCol || document.querySelector(".footer-col > .share-bar")) return;

    var url = location.href;
    var title = document.title;
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);

    var bar = document.createElement("div");
    bar.className = "share-bar";
    bar.innerHTML =
      '<span class="share-label">🔗 Share:</span>' +
      '<button class="share-btn" data-act="copy">Copy</button>' +
      '<a class="share-btn" data-act="weibo" href="https://service.weibo.com/share/share.php?url=' + u + '&title=' + t + '" target="_blank" rel="noopener">Weibo</a>' +
      '<a class="share-btn" data-act="qq" href="https://connect.qq.com/widget/shareqq/index.html?url=' + u + '&title=' + t + '" target="_blank" rel="noopener">QQ</a>' +
      '<button class="share-btn" data-act="wechat">WeChat</button>' +
      '<button class="share-btn" data-act="more">More</button>';

    footerCol.appendChild(bar);

    bar.querySelector('[data-act="copy"]').addEventListener("click", function () {
      copyText(url).then(function () { toast("Link copied — go ahead and share it 👍"); })
        .catch(function () { toast("Copy failed — please copy the address bar link manually"); });
    });
    bar.querySelector('[data-act="wechat"]').addEventListener("click", function () {
      copyText(url).then(function () { toast("Link copied — paste it in WeChat to share 👍"); })
        .catch(function () { toast("Copy failed — please copy the address bar link manually"); });
    });

    var more = bar.querySelector('[data-act="more"]');
    if (navigator.share) {
      more.addEventListener("click", function () {
        navigator.share({ title: title, url: url }).catch(function () {});
      });
    } else {
      more.style.display = "none";
    }
  }

  function setupThemeTitle() {
    var btn = document.getElementById("themeToggle");
    if (btn && !btn.getAttribute("title")) {
      btn.setAttribute("title", "Toggle dark / light");
    }
  }

  function init() {
    compactFooterBottom();
    initDonate();
    injectShareBar();
    setupThemeTitle();
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
