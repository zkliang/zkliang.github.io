/* 批量增强所有 HTML 页面：
 * 1. 在 head 的 style.min.css 后注入 widgets.css
 * 2. 在 body 末尾的 theme.min.js 后注入 widgets.js
 * 3. 把 donate-box 改为紧凑卡片 + 按钮展开二维码（保留原图路径）
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlFiles = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', '.workbuddy', 'scripts'].includes(e.name)) continue;
      walk(p);
    } else if (e.name.endsWith('.html')) {
      htmlFiles.push(p);
    }
  }
}
walk(root);

console.log('找到 HTML 文件:', htmlFiles.length);

let cssAdded = 0, jsAdded = 0, donateFixed = 0;

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  const inSub = rel.includes(path.sep);
  const prefix = inSub ? '../' : '';

  // 1. 注入 widgets.css（在 style.min.css 之后）
  if (!html.includes('widgets.css')) {
    html = html.replace(
      /(<link\s+rel="stylesheet"\s+href="[^"]*style\.min\.css"[^>]*>)/,
      (m) => m + `\n  <link rel="stylesheet" href="${prefix}assets/css/widgets.css" />`
    );
    cssAdded++;
  }

  // 2. 注入 widgets.js（优先在 theme.min.js 后，否则 </body> 前）
  if (!html.includes('widgets.js')) {
    const themeRe = /(<script\s+defer\s+src="[^"]*theme\.min\.js"[^>]*><\/script>)/;
    if (themeRe.test(html)) {
      html = html.replace(themeRe, (m) => m + `\n  <script defer src="${prefix}assets/js/widgets.js"></script>`);
    } else {
      html = html.replace(/(<\/body>)/, `  <script defer src="${prefix}assets/js/widgets.js"></script>\n$1`);
    }
    jsAdded++;
  }

  // 3. 增强 donate-box：紧凑卡片 + 按钮展开二维码（保留原图路径）
  html = html.replace(/<details class="donate-box"[^>]*>([\s\S]*?)<\/details>/g, (m, inner) => {
    const imgs = [...inner.matchAll(/<img\s+src="([^"]+)"[^>]*>/g)].map((x) => x[1]);
    const wx = imgs[0] || '/assets/img/wechat-donate.jpg';
    const ali = imgs[1] || '/assets/img/alipay-donate.jpg';
    donateFixed++;
    return `<details class="donate-box" open>
  <summary class="footer-title donate-summary">☕ 请作者喝杯咖啡</summary>
  <p class="donate-hint">如果 FreeNav 对你有帮助，欢迎扫码支持作者 💛 这是对我持续维护 FreeNav 最大的鼓励，<strong>不会影响你使用站内任何功能</strong>。</p>
  <div class="donate-actions">
    <button class="donate-link" data-qr="wechat" type="button">微信打赏</button>
    <button class="donate-link" data-qr="alipay" type="button">支付宝支持</button>
  </div>
  <div class="donate-qr-panel">
    <figure class="donate-qr" data-qr="wechat"><img src="${wx}" alt="微信赞赏码" loading="lazy"><figcaption>微信扫一扫</figcaption></figure>
    <figure class="donate-qr" data-qr="alipay"><img src="${ali}" alt="支付宝收款码" loading="lazy"><figcaption>支付宝扫一扫</figcaption></figure>
  </div>
</details>`;
  });

  fs.writeFileSync(file, html);
}

console.log(`css 引用新增: ${cssAdded}, js 引用新增: ${jsAdded}, donate 增强: ${donateFixed}`);
