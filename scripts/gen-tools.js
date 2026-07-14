/*
 * FreeNav 静态详情页生成器
 * 读取 assets/js/data.js + assets/js/licenses.js，批量产出：
 *   - tools/<id>.html      每款软件的独立 SEO 落地页
 *   - tools.html           全部工具索引（内链枢纽）
 *   - sitemap.xml          扩充 98 个详情页 URL
 * 运行：node scripts/gen-tools.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://freenav.net";

/* ---------- 数据加载 ---------- */
function loadWindow(file) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  const window = {};
  new Function("window", code)(window);
  return window;
}
const w = loadWindow("assets/js/data.js");
const lic = loadWindow("assets/js/licenses.js");
const SOFTWARE = w.FREENAV_SOFTWARE || [];
const CATEGORIES = w.FREENAV_CATEGORIES || [];
const LICENSES = lic.FREENAV_LICENSES || {};

const CAT = {};
CATEGORIES.forEach((c) => (CAT[c.key] = c));
const PLATFORM_LABEL = { Win: "Windows", Mac: "macOS", Linux: "Linux", Web: "Web", Android: "Android", iOS: "iOS", "自托管": "自托管" };

/* ---------- 工具函数 ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function catOf(item) { return CAT[item.cat] || { label: item.cat, icon: "🔹", desc: "", guide: "", color: "#38bdf8", color2: "#0284c7" }; }
function platformsCN(item) { return (item.platforms || []).map((p) => PLATFORM_LABEL[p] || p).join(" / "); }
function firstChar(name) { return (name || "?").trim().charAt(0).toUpperCase(); }

function badge(text, cls) { return '<span class="badge' + (cls ? " " + cls : "") + '">' + esc(text) + "</span>"; }

/* 同类卡片（内链到详情页） */
function similarCard(item, base = "") {
  const c = catOf(item);
  const pf = (item.platforms || []).map((p) => badge(PLATFORM_LABEL[p] || p)).join("");
  const tags = (item.tags || []).slice(0, 4).map((t) => '<span class="tag">' + esc(t) + "</span>").join("");
  return (
    '<article class="card" style="--cat:' + esc(c.color) + ';--cat-2:' + esc(c.color2 || c.color) + '">' +
      '<div class="card-head">' +
        '<div class="card-logo"><span class="logo-fallback">' + esc(firstChar(item.name)) + "</span></div>" +
        '<div class="card-name-wrap">' +
          '<span class="card-name">' + esc(item.name) + "</span>" +
          badge(item.pricing, "price-" + item.pricing) +
        "</div>" +
      "</div>" +
      '<p class="card-desc">' + esc(item.desc) + "</p>" +
      '<div class="badges">' + pf + "</div>" +
      '<div class="tags">' + tags + "</div>" +
      '<a class="card-link" href="' + esc(base + item.id) + '.html">查看详情 <span aria-hidden="true">→</span></a>' +
    "</article>"
  );
}

/* ---------- 详情页 ---------- */
function toolPage(item) {
  const c = catOf(item);
  const licTxt = LICENSES[item.id];
  const licBadge = licTxt ? badge(licTxt, "lic-badge") : "";
  const pf = (item.platforms || []).map((p) => badge(PLATFORM_LABEL[p] || p)).join("");
  const tags = (item.tags || []).map((t) => '<span class="tag">' + esc(t) + "</span>").join("");
  const url = item.url || "#";
  const rel = item.affiliateUrl ? "sponsored noopener noreferrer" : "noopener noreferrer";

  const similar = SOFTWARE.filter((s) => s.cat === item.cat && s.id !== item.id).slice(0, 9).map((s) => similarCard(s)).join("");

  const descMeta = (item.desc + " 支持 " + platformsCN(item) + "。" + c.desc + " FreeNav 汇总 " + item.name + " 的官网、授权与同类替代。").slice(0, 160);
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.name,
    applicationCategory: c.label,
    operatingSystem: platformsCN(item),
    description: item.desc,
    url: SITE + "/tools/" + item.id + ".html",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(item.name)} 下载（${esc(c.label)}）· 免费开源工具 | FreeNav</title>
  <meta name="description" content="${esc(descMeta)}" />
  <meta name="keywords" content="${esc([item.name, c.label].concat(item.tags || []).concat(["免费软件", "开源软件", "FreeNav"]).join(","))}" />
  <link rel="canonical" href="${SITE}/tools/${esc(item.id)}.html" />
  <meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)" />
  <link rel="manifest" href="../manifest.webmanifest" />
  <link rel="apple-touch-icon" href="../apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FreeNav" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(item.name)} · FreeNav 免费开源软件导航" />
  <meta property="og:description" content="${esc(item.desc)}" />
  <meta property="og:url" content="${SITE}/tools/${esc(item.id)}.html" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:image" content="${SITE}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="../assets/css/style.min.css" />
  <link rel="stylesheet" href="../assets/css/tools.css" />
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
</head>
<body>
  <a class="skip-link" href="#top">跳到主内容</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">
        <span class="brand-mark">◆</span>
        <span class="brand-name">FreeNav</span>
        <span class="brand-sub">免费软件导航</span>
      </a>
      <nav class="top-nav">
        <a href="/#categories">全部分类</a>
        <a href="/#columns">细分专题</a>
        <a href="/tools.html">全部工具</a>
        <a href="/privacy.html">隐私</a>
        <a href="/business.html">商务合作</a>
        <a href="/disclaimer.html">免责</a>
      </nav>
      <button class="nav-toggle" id="navToggle" type="button" aria-label="打开菜单" aria-expanded="false">☰</button>
    </div>
  </header>
  <main class="container" id="top">
    <nav class="breadcrumb" aria-label="面包屑">
      <a href="/">首页</a> <span aria-hidden="true">/</span>
      <a href="/#categories">${esc(c.label)}</a> <span aria-hidden="true">/</span>
      <span>${esc(item.name)}</span>
    </nav>

    <article class="tool-detail">
      <header class="tool-head">
        <div class="tool-logo" style="--cat:${esc(c.color)};--cat-2:${esc(c.color2 || c.color)}"><span class="logo-fallback">${esc(firstChar(item.name))}</span></div>
        <div>
          <h1 class="tool-title">${esc(item.name)}</h1>
          <p class="tool-cat">${esc(c.icon || "🔹")} ${esc(c.label)} · 免费 / 开源软件</p>
        </div>
      </header>

      <div class="tool-badges">
        ${badge(item.pricing, "price-" + item.pricing)}
        ${licBadge}
        ${pf}
      </div>

      <div class="tags">${tags}</div>

      <p class="tool-desc">${esc(item.desc)}</p>

      <div class="tool-actions">
        <a class="btn-primary" href="${esc(url)}" target="_blank" rel="${rel}">访问 ${esc(item.name)} 官网下载 <span aria-hidden="true">→</span></a>
        <a class="btn-ghost" href="/#categories">浏览全部分类</a>
      </div>

      <section class="tool-why">
        <h2>为什么 FreeNav 收录 ${esc(item.name)}？</h2>
        <p>${esc(c.desc)} 在「${esc(c.label)}」这个使用场景下，${esc(item.name)} 以「${esc(item.pricing)}」的方式提供，适合希望减少软件开支、又不愿被广告和追踪打扰的用户。${esc(c.guide)}</p>
      </section>

      <section class="tool-alt">
        <h2>同类 ${esc(c.label)} 工具推荐</h2>
        <p class="col-sub">以下均为已验证的免费 / 开源方案，点击查看详情与官网。</p>
        <div class="grid">${similar}</div>
      </section>
    </article>
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col">
        <p class="footer-brand">◆ FreeNav</p>
        <p class="footer-note">精选免费 / 开源软件导航。内容灵感与清单来源：<a href="https://fmhy.net/" target="_blank" rel="noopener noreferrer">fmhy.net</a>。</p>
      </div>
      <div class="footer-col">
        <p class="footer-title">链接</p>
        <p><a href="/">首页</a></p>
        <details class="donate-box">
          <summary class="footer-title donate-summary">☕ 请作者喝杯咖啡</summary>
          <p class="footer-note">如果 FreeNav 帮到了你，欢迎扫码支持，用于服务器与日常维护 💛</p>
          <div class="donate-qrs">
            <figure><img src="../assets/img/wechat-donate.jpg" alt="微信赞赏码" loading="lazy"><figcaption>微信</figcaption></figure>
            <figure><img src="../assets/img/alipay-donate.jpg" alt="支付宝收款码" loading="lazy"><figcaption>支付宝</figcaption></figure>
          </div>
        </details>
        <p><a href="/tools.html">全部工具</a></p>
        <p><a href="/business.html">商务合作</a></p>
        <p><a href="/privacy.html">隐私政策</a></p>
        <p><a href="/disclaimer.html">免责声明</a></p>
      </div>
    </div>
    <div class="container footer-bottom"><span>© <span id="year"></span> FreeNav · 免费与开源软件导航</span></div>
    <div class="footer-stat">
      <span id="busuanzi_container_site_pv" style="display:none">本站总访问量 <span id="busuanzi_value_site_pv"></span> 次</span>
      <span id="busuanzi_container_site_uv" style="display:none"> | 本站访客 <span id="busuanzi_value_site_uv"></span> 人</span>
    </div>
  </footer>
  <script>if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();</script>
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <script defer src="../assets/js/theme.min.js"></script>
  <script defer src="../assets/js/sw-register.js"></script>
  <script async src="https://cn.vercount.one/js"></script>
</body>
</html>
`;
}

/* ---------- 索引页 ---------- */
function indexPage(basePath = "", linkBase = "tools/") {
  let blocks = "";
  CATEGORIES.forEach((c) => {
    const items = SOFTWARE.filter((s) => s.cat === c.key);
    const cards = items.map((s) => similarCard(s, linkBase)).join("");
    blocks +=
      '<section class="cat-block">' +
        "<h2>" + esc(c.icon || "🔹") + " " + esc(c.label) + ' <span class="cat-count">' + items.length + " 款</span></h2>" +
        '<p class="cat-desc">' + esc(c.desc) + "</p>" +
        '<div class="grid">' + cards + "</div>" +
      "</section>";
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>全部免费 / 开源软件 - FreeNav（${SOFTWARE.length} 款）</title>
  <meta name="description" content="FreeNav 汇总 ${SOFTWARE.length} 款经过验证的免费与开源软件，按 10 大使用场景分类，每款均附官网、授权与同类替代。" />
  <link rel="canonical" href="${SITE}/tools.html" />
  <meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)" />
  <link rel="manifest" href="${basePath}manifest.webmanifest" />
  <link rel="apple-touch-icon" href="${basePath}apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FreeNav" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="全部免费 / 开源软件 - FreeNav" />
  <meta property="og:description" content="FreeNav 汇总 ${SOFTWARE.length} 款免费开源软件，按场景分类，附官网与同类替代。" />
  <meta property="og:url" content="${SITE}/tools.html" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:image" content="${SITE}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="${basePath}assets/css/style.min.css" />
  <link rel="stylesheet" href="${basePath}assets/css/tools.css" />
  <link rel="icon" href="${basePath}favicon.svg" type="image/svg+xml" />
</head>
<body>
  <a class="skip-link" href="#top">跳到主内容</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">
        <span class="brand-mark">◆</span>
        <span class="brand-name">FreeNav</span>
        <span class="brand-sub">免费软件导航</span>
      </a>
      <nav class="top-nav">
        <a href="/#categories">全部分类</a>
        <a href="/#columns">细分专题</a>
        <a href="/tools.html">全部工具</a>
        <a href="/privacy.html">隐私</a>
        <a href="/business.html">商务合作</a>
        <a href="/disclaimer.html">免责</a>
      </nav>
      <button class="nav-toggle" id="navToggle" type="button" aria-label="打开菜单" aria-expanded="false">☰</button>
    </div>
  </header>
  <main class="container tools-index" id="top">
    <h1>全部免费 / 开源软件</h1>
    <p class="lead">FreeNav 目前收录 <b>${SOFTWARE.length}</b> 款经过验证的免费与开源软件，按 10 大使用场景分类。点开任意工具查看官网、授权方式与同类替代。</p>
    ${blocks}
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col">
        <p class="footer-brand">◆ FreeNav</p>
        <p class="footer-note">精选免费 / 开源软件导航。内容灵感与清单来源：<a href="https://fmhy.net/" target="_blank" rel="noopener noreferrer">fmhy.net</a>。</p>
      </div>
      <div class="footer-col">
        <p class="footer-title">链接</p>
        <p><a href="/">首页</a></p>
        <details class="donate-box">
          <summary class="footer-title donate-summary">☕ 请作者喝杯咖啡</summary>
          <p class="footer-note">如果 FreeNav 帮到了你，欢迎扫码支持，用于服务器与日常维护 💛</p>
          <div class="donate-qrs">
            <figure><img src="${basePath}assets/img/wechat-donate.jpg" alt="微信赞赏码" loading="lazy"><figcaption>微信</figcaption></figure>
            <figure><img src="${basePath}assets/img/alipay-donate.jpg" alt="支付宝收款码" loading="lazy"><figcaption>支付宝</figcaption></figure>
          </div>
        </details>
        <p><a href="/business.html">商务合作</a></p>
        <p><a href="/privacy.html">隐私政策</a></p>
        <p><a href="/disclaimer.html">免责声明</a></p>
      </div>
    </div>
    <div class="container footer-bottom"><span>© <span id="year"></span> FreeNav · 免费与开源软件导航</span></div>
  </footer>
  <script>if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();</script>
  <script defer src="${basePath}assets/js/theme.min.js"></script>
  <script defer src="${basePath}assets/js/sw-register.js"></script>
  <script async src="https://cn.vercount.one/js"></script>
</body>
</html>
`;
}

/* ---------- sitemap ---------- */
const FRAMEWORK = [
  { loc: "/", pri: "1.0", freq: "weekly", img: { loc: "/og.png", title: "FreeNav · 免费软件导航" } },
  { loc: "/business.html", pri: "0.6", freq: "monthly" },
  { loc: "/privacy.html", pri: "0.3", freq: "yearly" },
  { loc: "/terms.html", pri: "0.3", freq: "yearly" },
  { loc: "/disclaimer.html", pri: "0.3", freq: "yearly" },
  { loc: "/columns/opensource-alt.html", pri: "0.7", freq: "monthly", img: { loc: "/og.png", title: "开源 / 免费替代库 · FreeNav" } },
  { loc: "/columns/newbie.html", pri: "0.7", freq: "monthly", img: { loc: "/og.png", title: "新人装机清单 · FreeNav" } },
  { loc: "/columns/design.html", pri: "0.7", freq: "monthly", img: { loc: "/og.png", title: "设计师免费素材全家桶 · FreeNav" } },
  { loc: "/columns/local-ai.html", pri: "0.7", freq: "monthly", img: { loc: "/og.png", title: "本地 AI 工具箱 · FreeNav" } },
];

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  let out = '<?xml version="1.0" encoding="UTF-8"?>\n';
  out += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  function url(u) {
    out += "  <url>\n";
    out += "    <loc>" + SITE + u.loc + "</loc>\n";
    out += "    <lastmod>" + today + "</lastmod>\n";
    out += "    <changefreq>" + u.freq + "</changefreq>\n";
    out += "    <priority>" + u.pri + "</priority>\n";
    if (u.img) {
      out += "    <image:image>\n";
      out += "      <image:loc>" + SITE + u.img.loc + "</image:loc>\n";
      out += "      <image:title>" + esc(u.img.title) + "</image:title>\n";
      out += "    </image:image>\n";
    }
    out += "  </url>\n";
  }
  FRAMEWORK.forEach(url);
  url({ loc: "/tools.html", pri: "0.5", freq: "monthly" });
  SOFTWARE.forEach((s) => url({ loc: "/tools/" + s.id + ".html", pri: "0.4", freq: "monthly" }));
  out += "</urlset>\n";
  return out;
}

/* ---------- 执行 ---------- */
const toolsDir = path.join(ROOT, "tools");
fs.mkdirSync(toolsDir, { recursive: true });

let count = 0;
SOFTWARE.forEach((item) => {
  fs.writeFileSync(path.join(toolsDir, item.id + ".html"), toolPage(item), "utf8");
  count++;
});
fs.writeFileSync(path.join(ROOT, "tools.html"), indexPage("", "tools/"), "utf8");
fs.writeFileSync(path.join(ROOT, "tools/index.html"), indexPage("../", ""), "utf8");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(), "utf8");

console.log("生成完成：详情页 " + count + " 个，索引页 2 个（tools.html + tools/index.html），sitemap 已扩充至 " + (FRAMEWORK.length + 1 + count) + " 条 URL。");
