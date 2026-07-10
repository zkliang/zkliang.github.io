/* FreeNav 站点配置 —— 全站唯一需要修改的「域名」入口
 * 上线前：把 freenav.net 换成你的真实域名（如 https://freenav.com）。
 * 注意：index.html / sitemap.xml / robots.txt / 各栏目页 <link rel="canonical"> 里
 *       的 freenav.net 占位符也要一并替换（全站搜索该字符串即可）。
 */
window.FREENAV_SITE_URL = "https://freenav.net";

/*
 * CPS 推广链接插槽（变现用，零基础可填）
 * 教程见 _运营/CPS手把手教程.md
 * 用法：把你的联盟推广链接填进 url 即可，首页底部自动渲染「编辑推荐」卡片。
 * 数组留空 [] 则不显示任何卡片。tag 必须保留（合规标识「推广」）。
 * 想加几个就加几个，每行一个，逗号隔开。
 */
window.FREENAV_AFFILIATE = [
  // 示例（删除或替换成你自己的链接）：
  // {
  //   name: "机械键盘推荐",
  //   note: "刚需外设，成交率高",
  //   url: "https://你的淘宝联盟推广链接",
  //   tag: "推广"
  // },
];
