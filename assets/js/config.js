/* FreeNav 站点配置 —— 全站唯一需要修改的「域名」入口
 * 上线前：把 freenav.net 换成你的真实域名（如 https://freenav.com）。
 * 注意：index.html / sitemap.xml / robots.txt / 各栏目页 <link rel="canonical"> 里
 *       的 freenav.net 占位符也要一并替换（全站搜索该字符串即可）。
 */
window.FREENAV_SITE_URL = "https://freenav.net";

/*
 * CPS 推广链接插槽（变现用，零基础可填）
 * 教程见 _运营/CPS手把手教程.md
 * 用法：把你的联盟推广链接填进 url 即可，首页底部自动渲染「赞助推荐」卡片。
 * 数组留空 [] 则不显示任何卡片。tag 必须保留（合规标识「广告」）。
 * 想加几个就加几个，每行一个，逗号隔开。
 */
/* 国内用户选型提醒（2026-07-15）：
 *  - 优先选「佣金能结算到 支付宝 / 国内银行卡」的联盟，到账最省心：阿里云、腾讯云、华为云等。
 *  - 海外联盟（Namecheap / Vercel 等）佣金多为 PayPal 或账户额度，提现国内有摩擦，按需保留。
 *  - Vercel 推荐仅为「账户额度」、非现金，已移除；腾讯云因注册名额上限暂无法接入，已移除。
 *  - 想加新联盟：复制下面任意一项改 name/note/url/tag 即可，无需改其它代码。
 */
// 2026-11-19：按站主要求移除全部广告位，数组留空则首页不渲染任何赞助卡片。
// 如需恢复，把下面的联盟条目按 { name, note, url, tag:"广告" } 格式填回即可。
window.FREENAV_AFFILIATE = [];
