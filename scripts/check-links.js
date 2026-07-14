// 全站内部链接校验：扫描所有 .html，提取站内相对链接（tools/*.html 及根级 *.html），
// 检查目标文件是否存在，输出所有死链。用于防止出现类似 7-zip.html 的 404 隐患。
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_DIRS = [ROOT, path.join(ROOT, 'tools')];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'assets'].includes(e.name)) continue;
      walk(p, out);
    } else if (e.name.endsWith('.html')) {
      out.push(p);
    }
  }
}

const pages = [];
for (const d of HTML_DIRS) walk(d, pages);

const hrefRe = /href=(?:"([^"]+)"|'([^']+)')/g;
const missing = new Map(); // key: broken link, value: Set of source files

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1] || m[2];
    if (!href) continue;
    // 只校验站内相对链接（排除 http(s)://、#、mailto:、tel:、javascript:）
    if (/^(https?:)?\/\//i.test(href) || /^#/.test(href) || /^(mailto|tel|javascript):/i.test(href)) continue;
    // 去掉锚点和查询串
    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean.endsWith('/')) continue;
    // 解析为磁盘路径
    let target;
    if (clean.startsWith('/')) target = path.join(ROOT, clean);
    else target = path.resolve(path.dirname(page), clean);
    if (!fs.existsSync(target)) {
      const key = clean;
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key).add(path.relative(ROOT, page));
    }
  }
}

if (missing.size === 0) {
  console.log('✅ 全站内部链接校验通过，未发现死链。');
} else {
  console.log(`❌ 发现 ${missing.size} 个死链：`);
  for (const [link, sources] of missing) {
    console.log(`  • ${link}  <-  引用自: ${[...sources].join(', ')}`);
  }
  process.exit(1);
}
