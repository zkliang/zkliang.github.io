/* FreeNav 提交页：把表单内容编码成 GitHub Issue 预填链接（纯前端，无后端、无追踪） */
(function () {
  "use strict";
  var REPO = "https://github.com/zkliang/zkliang.github.io/issues/new";
  var tabs = document.querySelectorAll(".submit-tab");
  var panels = { tool: document.getElementById("panel-tool"), error: document.getElementById("panel-error") };
  if (!tabs.length) return;

  Array.prototype.forEach.call(tabs, function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      Array.prototype.forEach.call(tabs, function (t) {
        var on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].hidden = k !== name; });
    });
  });

  function openIssue(title, body, labels) {
    var url = REPO + "?title=" + encodeURIComponent(title) +
      "&body=" + encodeURIComponent(body) +
      (labels ? "&labels=" + encodeURIComponent(labels) : "");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  var formTool = document.getElementById("formTool");
  formTool.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
    var body = "**工具名称：** " + v("name") + "\n\n" +
      "**官网地址：** " + v("url") + "\n\n" +
      "**适合分类：** " + v("cat") + "\n\n" +
      "**一句话介绍：** " + v("desc") + "\n\n" +
      "**为什么值得收录：**\n" + (v("why") || "（未填写）") + "\n\n---\n由 FreeNav 提交页面生成。";
    openIssue("[新工具] " + v("name"), body, "提交工具");
  });

  var formError = document.getElementById("formError");
  formError.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
    var body = "**问题类型：** " + v("kind") + "\n\n" +
      "**涉及的工具或页面：** " + v("target") + "\n\n" +
      "**具体情况：**\n" + v("detail") + "\n\n---\n由 FreeNav 提交页面生成。";
    openIssue("[纠错] " + v("target"), body, "纠错");
  });
})();
