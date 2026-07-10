// 生成 rss.xml（基于 data.js 的软件清单）。用法：node scripts/gen_rss.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const dataText = readFileSync(resolve(ROOT, "assets/js/data.js"), "utf8");
const confText = readFileSync(resolve(ROOT, "assets/js/config.js"), "utf8");

let SITE = "https://freenav.example.com";
const cm = confText.match(/FREENAV_SITE_URL\s*=\s*"([^"]+)"/);
if (cm) SITE = cm[1];

const names = [...dataText.matchAll(/name:\s*"([^"]+)"/g)].map((x) => x[1]);
const descs = [...dataText.matchAll(/desc:\s*"([^"]+)"/g)].map((x) => x[1]);
const urls = [...dataText.matchAll(/url:\s*"([^"]+)"/g)].map((x) => x[1]);

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const items = [];
for (let i = 0; i < names.length; i++) {
  const link = urls[i] || SITE;
  items.push(
    "    <item>\n" +
    "      <title>" + esc(names[i]) + "</title>\n" +
    "      <link>" + esc(link) + "</link>\n" +
    "      <guid isPermaLink=\"false\">" + esc(link) + "</guid>\n" +
    "      <description>" + esc(descs[i] || "") + "</description>\n" +
    "    </item>"
  );
}

const now = new Date().toUTCString();
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
  "  <channel>\n" +
  "    <title>FreeNav · 免费软件导航</title>\n" +
  "    <link>" + SITE + "</link>\n" +
  "    <description>精选 100+ 款真正免费、开源的软件，附 4 个差异化专题对比表与测评。</description>\n" +
  "    <language>zh-CN</language>\n" +
  "    <lastBuildDate>" + now + "</lastBuildDate>\n" +
  '    <atom:link href="' + SITE + '/rss.xml" rel="self" type="application/rss+xml" />\n' +
  items.join("\n") + "\n" +
  "  </channel>\n</rss>\n";

writeFileSync(resolve(ROOT, "rss.xml"), xml);
console.log("rss.xml 已生成，共 " + names.length + " 条");
