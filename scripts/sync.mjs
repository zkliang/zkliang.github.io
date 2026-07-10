#!/usr/bin/env node
/*
 * FreeNav 同步辅助脚本（半自动，安全版）
 * 1) 校验当前 data.js：重复 id、非法分类、栏目 picks 指向不存在的 id 等；
 * 2) 从 FMHY 拉取最新条目，抽取 [名称](链接) 写成 data.candidates.js 草稿；
 *    ⚠️ 不会自动写入 data.js —— 请人工审阅 candidates 后合并，避免引入失效/错误链接。
 *
 * 用法：
 *   node scripts/sync.mjs                 # 校验 + 拉取 FMHY 总索引
 *   node scripts/sync.mjs <分类URL>       # 校验 + 拉取指定页面
 *   node scripts/sync.mjs --check         # 仅校验本地数据，不联网
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "assets/js/data.js");
const COLS = resolve(ROOT, "assets/js/columns.js");
const DEFAULT_URL = "https://raw.githubusercontent.com/fmhy/FMHY/main/index.md";

const onlyCheck = process.argv.includes("--check");
const target = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : DEFAULT_URL;

function validate() {
  const dt = readFileSync(DATA, "utf8");
  const issues = [];
  const ids = [...dt.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) issues.push("重复 id：" + [...new Set(dup)].join(", "));
  const cats = [...dt.matchAll(/cat:\s*"([^"]+)"/g)].map((m) => m[1]);
  const validCats = ["system", "office", "design", "dev", "media", "download", "ai", "security", "study", "mobile"];
  const badCat = [...new Set(cats)].filter((c) => validCats.indexOf(c) < 0);
  if (badCat.length) issues.push("非法分类值：" + badCat.join(", "));

  // 栏目 picks.ids 孤儿检查
  let ct = "";
  try { ct = readFileSync(COLS, "utf8"); } catch (e) { ct = ""; }
  const idSet = new Set(ids);
  const pk = [...ct.matchAll(/ids:\s*\[([^\]]*)\]/g)];
  pk.forEach((m) => {
    const arr = m[1].match(/"([^"]+)"/g) || [];
    arr.forEach((s) => {
      const id = s.replace(/"/g, "");
      if (!idSet.has(id)) issues.push("栏目 picks 指向不存在的 id：" + id);
    });
  });

  console.log("── 本地数据校验 ──");
  if (!issues.length) console.log("✓ 通过：无重复 id、分类合法、栏目 picks 均存在。");
  else issues.forEach((i) => console.log("✗ " + i));
  return issues;
}

async function fetchCandidates() {
  console.log("\n── 拉取 FMHY 候选 ──");
  let text;
  try {
    const res = await fetch(target, { headers: { "User-Agent": "FreeNavSync/1.0" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    text = await res.text();
  } catch (e) {
    console.error("拉取失败：" + e.message + "（跳过候选生成，仅保留校验结果）");
    return;
  }
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    const url = m[2].trim();
    if (!name || /^[?!#]/.test(name)) continue;
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, url });
  }
  if (!out.length) { console.log("未抽取到链接，可能页面结构变化。"); return; }
  const head = "// FreeNav 候选草稿（由 scripts/sync.mjs 自动生成，勿直接合并）\n" +
    "// 请人工核对名称/链接/分类后，挑选加入 assets/js/data.js。\n" +
    "// 每条：{ id, name, cat, desc, url, pricing, platforms, tags }\n\n";
  const body = out.map((it) => '// - ' + it.name + "  =>  " + it.url).join("\n") + "\n";
  mkdirSync(resolve(ROOT, "scripts/.cache"), { recursive: true });
  writeFileSync(resolve(ROOT, "scripts/.cache/candidates.md"), head + body);
  console.log("✓ 抽取 " + out.length + " 条，已写入 scripts/.cache/candidates.md（人工核对后并入 data.js）");
}

await validate();
if (!onlyCheck) await fetchCandidates();
console.log("\n完成。data.js 永远不被本脚本覆盖，请手动合并候选。");
