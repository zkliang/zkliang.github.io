/* FreeNav 增强组件：分享栏注入 + 复制链接 + 主题按钮原生提示 */
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

  function injectShareBar() {
    var footer = document.querySelector(".site-footer .footer-inner");
    if (!footer || footer.querySelector(".share-bar")) return;

    var url = location.href;
    var title = document.title;
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);

    var bar = document.createElement("div");
    bar.className = "share-bar";
    bar.innerHTML =
      '<span class="share-label">🔗 分享给好友：</span>' +
      '<button class="share-btn" data-act="copy">📋 复制链接</button>' +
      '<a class="share-btn" data-act="weibo" href="https://service.weibo.com/share/share.php?url=' + u + '&title=' + t + '" target="_blank" rel="noopener">微博</a>' +
      '<a class="share-btn" data-act="qq" href="https://connect.qq.com/widget/shareqq/index.html?url=' + u + '&title=' + t + '" target="_blank" rel="noopener">QQ</a>' +
      '<button class="share-btn" data-act="wechat">💬 微信</button>' +
      '<button class="share-btn" data-act="more">⋯ 更多</button>';

    footer.appendChild(bar);

    bar.querySelector('[data-act="copy"]').addEventListener("click", function () {
      copyText(url).then(function () { toast("链接已复制，去分享给好友吧 👍"); })
        .catch(function () { toast("复制失败，请手动复制地址栏链接"); });
    });
    bar.querySelector('[data-act="wechat"]').addEventListener("click", function () {
      copyText(url).then(function () { toast("链接已复制，去微信粘贴给好友 👍"); })
        .catch(function () { toast("复制失败，请手动复制地址栏链接"); });
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
      btn.setAttribute("title", "切换深色 / 浅色");
    }
  }

  function init() {
    injectShareBar();
    setupThemeTitle();
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
