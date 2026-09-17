// 生成 rss.xml（基于 articles/ 下的专栏文章，而非工具清单）。
// 用法：node scripts/gen_rss.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE = "https://freenav.net";
const ART_DIR = resolve(ROOT, "articles");

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parse(html, file) {
  const titleM = html.match(/<title>([^<]+)<\/title>/);
  const descM = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  let title = titleM ? titleM[1] : file;
  title = title.replace(/\s*·\s*FreeNav\s*专栏\s*$/, ""); // 去掉后缀，保持 RSS 标题干净
  const desc = descM ? descM[1] : "";
  const dm = file.match(/(\d{4})-(\d{2})-(\d{2})/);
  const date = dm ? new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3])) : new Date(Date.UTC(2026, 6, 26));
  return { title, desc, file, date };
}

const items = readdirSync(ART_DIR)
  .filter((f) => f.endsWith(".html"))
  .map((f) => parse(readFileSync(resolve(ART_DIR, f), "utf8"), f))
  .sort((a, b) => b.date - a.date);

const itemXml = items
  .map((it) => {
    const link = `${SITE}/articles/${it.file}`;
    const pub = it.date.toUTCString();
    return (
      "    <item>\n" +
      "      <title>" + esc(it.title) + "</title>\n" +
      "      <link>" + esc(link) + "</link>\n" +
      "      <guid isPermaLink=\"true\">" + esc(link) + "</guid>\n" +
      "      <pubDate>" + pub + "</pubDate>\n" +
      "      <description>" + esc(it.desc) + "</description>\n" +
      "    </item>"
    );
  })
  .join("\n");

const now = new Date().toUTCString();
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
  "  <channel>\n" +
  "    <title>FreeNav · 免费软件导航</title>\n" +
  "    <link>" + SITE + "</link>\n" +
  "    <description>精选 128 款真正免费、开源的软件，覆盖 11 大场景，附 5 个差异化专题对比表与测评。</description>\n" +
  "    <language>zh-CN</language>\n" +
  "    <lastBuildDate>" + now + "</lastBuildDate>\n" +
  '    <atom:link href="' + SITE + '/rss.xml" rel="self" type="application/rss+xml" />\n' +
  itemXml + "\n" +
  "  </channel>\n</rss>\n";

writeFileSync(resolve(ROOT, "rss.xml"), xml);
console.log("rss.xml 已生成，共 " + items.length + " 篇文章");
