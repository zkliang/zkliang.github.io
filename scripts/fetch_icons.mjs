// 抓取 FreeNav 全部软件图标到本地 assets/icons/<domain>.png
// 用法：node scripts/fetch_icons.mjs
// 逻辑：从 data.js 提取每个软件 url 的域名 → 依次尝试多个 favicon 路径 → 存为 png（浏览器按内容嗅探，扩展名不影响显示）
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ICON_DIR = resolve(ROOT, "assets/icons");
mkdirSync(ICON_DIR, { recursive: true });

const dataText = readFileSync(resolve(ROOT, "assets/js/data.js"), "utf8");
const urls = [...dataText.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);

function domainOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}
const domains = [...new Set(urls.map(domainOf).filter(Boolean))];

const CANDIDATES = (d) => [
  `https://${d}/favicon.ico`,
  `https://${d}/apple-touch-icon.png`,
  `https://${d}/favicon.png`,
  `https://${d}/icon.png`,
  `https://${d}/static/favicon.ico`,
];

async function fetchIcon(d) {
  for (const url of CANDIDATES(d)) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 64) continue; // 太小的多半是占位/错误页
      const out = resolve(ICON_DIR, d + ".png");
      writeFileSync(out, buf);
      return { d, ok: true, bytes: buf.length };
    } catch { /* 尝试下一个候选 */ }
  }
  return { d, ok: false };
}

const results = [];
let done = 0;
for (const d of domains) {
  const out = resolve(ICON_DIR, d + ".png");
  if (existsSync(out)) { results.push({ d, ok: true, cached: true }); done++; continue; }
  const r = await fetchIcon(d);
  results.push(r);
  done++;
  if (done % 10 === 0) console.log(`进度 ${done}/${domains.length}`);
}

const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).map((r) => r.d);
// 生成浏览器端可用的成功域名清单，避免对失败域名发起多余 404
const okSet = {};
results.forEach((r) => { if (r.ok && !r.cached) okSet[r.d] = true; });
// 把已缓存的也纳入（重跑时 cached 项也算成功）
domains.forEach((d) => { if (existsSync(resolve(ICON_DIR, d + ".png"))) okSet[d] = true; });
writeFileSync(
  resolve(ROOT, "assets/js/icons.js"),
  "window.FREENAV_ICONS=" + JSON.stringify(okSet) + ";\n"
);
console.log(`\n完成：${ok}/${domains.length} 成功`);
console.log("已写入 assets/js/icons.js（" + Object.keys(okSet).length + " 个本地图标）");
if (failed.length) {
  console.log("失败域名（将在浏览器端回退外链/首字母）：");
  console.log(failed.join("\n"));
  writeFileSync(resolve(ICON_DIR, "_failed.txt"), failed.join("\n"));
}
