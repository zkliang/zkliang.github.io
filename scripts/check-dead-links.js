/**
 * FreeNav 死链检测脚本
 * 用法: node scripts/check-dead-links.js
 * 提取 data.min.js 中所有软件 URL，逐个检查 HTTP 状态
 * 输出: stdout（GitHub Actions 中自动读取）
 */

const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");

// 读取 data.js（CI 中从源码读，避免 .min 压缩问题）
const DATA_PATH = path.resolve(__dirname, "../assets/js/data.js");
const src = fs.readFileSync(DATA_PATH, "utf8");

// 提取 url 字段
const urlRegex = /url:\s*"([^"]+)"/g;
const urls = [];
let m;
while ((m = urlRegex.exec(src))) urls.push(m[1]);

console.log(`共发现 ${urls.length} 个软件链接\n`);

const DEAD = [];
const TIMEOUT = 15000; // 15s 超时
const CONCURRENCY = 8;  // 同时并发数

function check(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, {
      timeout: TIMEOUT,
      headers: {
        "User-Agent": "FreeNav-LinkChecker/1.0 (https://freenav.net)",
        Accept: "*/*",
      },
    }, (res) => {
      const status = res.statusCode;
      // 3xx 跳转 → 再检查最终跳转
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        resolve(check(res.headers.location));
        return;
      }
      res.resume();
      resolve({ url, status, ok: status >= 200 && status < 400 });
    });
    req.on("error", (e) => resolve({ url, status: "ERR", ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ url, status: "TIMEOUT", ok: false, error: "请求超时" }); });
  });
}

async function run() {
  const results = [];
  // 分批并发
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(check));
    results.push(...batchResults);
    // 每批输出进度
    const done = Math.min(i + CONCURRENCY, urls.length);
    const dead = results.filter((r) => !r.ok).length;
    process.stdout.write(`\r进度: ${done}/${urls.length}  异常: ${dead}`);
  }

  console.log("\n\n========== 检测结果 ==========");
  const ok = results.filter((r) => r.ok);
  const deadList = results.filter((r) => !r.ok);
  console.log(`正常: ${ok.length}/${results.length}`);
  console.log(`异常: ${deadList.length}/${results.length}\n`);

  if (deadList.length > 0) {
    console.log("以下链接可能存在异常 ↓\n");
    deadList.forEach((r) => {
      console.log(`  [${r.status}] ${r.url}${r.error ? " — " + r.error : ""}`);
    });
  }

  // GitHub Actions 输出
  if (deadList.length > 0) {
    console.log(`\ntotal_dead=${deadList.length}`);
    console.log("has_dead=true");
  } else {
    console.log("\nall_ok=true");
  }
}

run().catch(console.error);
