// 通过 GitHub Git Data API 推送本次样式/脚本更新（UTF-8，防 base64 事故）
const fs = require("fs");
const path = require("path");
const https = require("https");

const OWNER = "zkliang";
const REPO = "zkliang.github.io";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const baseFiles = [
  "assets/js/app.js", "assets/js/app.min.js",
  "assets/js/config.js", "assets/js/config.min.js",
  "assets/js/pwa-install.js", "assets/js/pwa-install.min.js",
  "assets/js/tools-detail.js", "assets/js/tools-detail.min.js",
  "assets/css/style.css", "assets/css/style.min.css",
  "assets/css/widgets.css",
  "assets/css/tools.css", "assets/css/tools.min.css",
  "scripts/gen-tools.js", "scripts/build.mjs",
  "index.html", "tools.html", "tools/index.html",
  "business.html", "disclaimer.html", "privacy.html", "terms.html",
  "columns/opensource-alt.html", "columns/newbie.html", "columns/design.html", "columns/local-ai.html"
];
// 展开 tools/*.html（98 详情页 + 7-zip.html 重定向页）
const toolPages = fs.existsSync("tools")
  ? fs.readdirSync("tools").filter((f) => f.endsWith(".html")).map((f) => "tools/" + f)
  : [];
const FILES = baseFiles.concat(toolPages);

if (!TOKEN) {
  console.error("需要环境变量 GITHUB_TOKEN 或 GH_TOKEN");
  process.exit(1);
}

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "api.github.com",
        port: 443,
        path: path,
        method: method,
        headers: {
          "Authorization": "token " + TOKEN,
          "Accept": "application/vnd.github+json",
          "User-Agent": "FreeNav-push/1.0",
          "Content-Type": "application/json",
          "Content-Length": data ? Buffer.byteLength(data) : 0
        }
      },
      (res) => {
        let chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(text)); } catch { resolve(text); }
          } else {
            reject(new Error("HTTP " + res.statusCode + ": " + text.slice(0, 500)));
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function blob(path) {
  const content = fs.readFileSync(path, "utf8");
  return api("POST", `/repos/${OWNER}/${REPO}/git/blobs`, { content, encoding: "utf-8" });
}

(async () => {
  try {
    console.log("→ 获取当前 ref...");
    const ref = await api("GET", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
    const parentSha = ref.object.sha;
    console.log("  parent:", parentSha.slice(0, 7));

    console.log("→ 获取 base tree...");
    const parentCommit = await api("GET", `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
    const baseTreeSha = parentCommit.tree.sha;

    console.log("→ 创建 blobs...");
    const treeEntries = [];
    for (const f of FILES) {
      const b = await blob(f);
      treeEntries.push({ path: f, mode: "100644", type: "blob", sha: b.sha });
      console.log("  " + f, "→", b.sha.slice(0, 7));
    }

    console.log("→ 创建 tree...");
    const newTree = await api("POST", `/repos/${OWNER}/${REPO}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeEntries
    });

    console.log("→ 创建 commit...");
    const newCommit = await api("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
      message: "fix: 删除原页脚底部小赞助条及对应 JS/CSS，赞助位仅保留首页新位置大卡片",
      tree: newTree.sha,
      parents: [parentSha]
    });

    console.log("→ 更新 ref...");
    await api("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: newCommit.sha,
      force: false
    });

    console.log("\n✓ 已推送:", newCommit.sha.slice(0, 7));
    console.log("  文件数:", FILES.length);
  } catch (e) {
    console.error("\n✗ 推送失败:", e.message);
    process.exit(1);
  }
})();
