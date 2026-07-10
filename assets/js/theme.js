/* FreeNav 主题切换：默认深色，偏好持久化；自动向各页 .top-nav 注入切换按钮 */
(function () {
  "use strict";
  var STORE_KEY = "freenav-theme";

  function apply(theme) {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    var btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "light" ? "☀️" : "🌙";
  }

  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
  apply(saved === "light" ? "light" : "dark");

  function toggle() {
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    var next = isLight ? "dark" : "light";
    apply(next);
    try { localStorage.setItem(STORE_KEY, next); } catch (e) {}
  }

  // 主页面已有按钮：直接绑定
  var existing = document.getElementById("themeToggle");
  if (existing) existing.addEventListener("click", toggle);

  // 栏目页等未手写按钮时，自动注入到 .top-nav
  function inject() {
    var nav = document.querySelector(".site-header .top-nav");
    if (!nav || nav.querySelector("#themeToggle")) return;
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.id = "themeToggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "切换深色 / 浅色主题");
    btn.addEventListener("click", toggle);
    nav.appendChild(btn);
    btn.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "☀️" : "🌙";
  }
  if (document.readyState !== "loading") inject();
  else document.addEventListener("DOMContentLoaded", inject);

  // 移动端导航：首页用 .sidebar 抽屉；栏目页用 .top-nav 下拉
  function initNav() {
    var btn = document.querySelector(".nav-toggle");
    if (!btn) return;
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.getElementById("sidebarBackdrop");
    var topnav = document.querySelector(".site-header .top-nav");

    // 首页：左侧栏抽屉
    if (sidebar) {
      function closeDrawer() {
        sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("show");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "☰";
      }
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("show", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "✕" : "☰";
      });
      if (backdrop) backdrop.addEventListener("click", closeDrawer);
      sidebar.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          if (window.matchMedia("(max-width: 960px)").matches) closeDrawer();
        });
      });
      document.addEventListener("click", function (e) {
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== btn) closeDrawer();
      });
      return;
    }

    // 栏目页：顶部 .top-nav 下拉
    if (topnav) {
      function close() {
        topnav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "☰";
      }
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = topnav.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "✕" : "☰";
      });
      topnav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", close);
      });
      document.addEventListener("click", function (e) {
        if (!topnav.contains(e.target) && e.target !== btn) close();
      });
    }
  }
  if (document.readyState !== "loading") initNav();
  else document.addEventListener("DOMContentLoaded", initNav);
})();
