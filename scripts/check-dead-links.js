/**
 * FreeNav 死链巡检脚本
 *
 * 设计原则：宁可漏报，不可误报。
 * 上一版把所有非 2xx 都算死链，导致反爬 403、官方维护 503、本地网络超时
 * 全部误报；同时只把结果 console.log 出来，从未写入 GITHUB_OUTPUT，
 * 工作流的"创建 Issue"步骤永远不触发。本版同时修复这两个问题。
 *
 * 分级：
 *   DEAD   —— 确证死链：404/410、DNS 解析失败、连接被拒、非法 URL
 *   REVIEW —— 需人工复核：403/401/429、5xx、超时、TLS 错误
 *   OK     —— 正常：2xx/3xx（跟随跳转后）
 *
 * 输出：
 *   stdout          人类可读报告
 *   GITHUB_OUTPUT   供 Actions 条件判断使用
 *   JSON 报告       供 github-script 步骤生成 Issue 正文
 *
 * 用法：node scripts/check-dead-links.js
 * 环境变量：LINK_REPORT_PATH（JSON 报告路径，默认系统临时目录）
 *          CHECK_TIMEOUT_MS（单请求超时，默认 15000）
 *          CHECK_CONCURRENCY（并发数，默认 8）
 *          CHECK_MAX_REDIRECTS（最大跳转次数，默认 5）
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const TIMEOUT = parseInt(process.env.CHECK_TIMEOUT_MS || '15000', 10);
const CONCURRENCY = parseInt(process.env.CHECK_CONCURRENCY || '8', 10);
const MAX_REDIRECTS = parseInt(process.env.CHECK_MAX_REDIRECTS || '5', 10);
const REPORT_PATH = process.env.LINK_REPORT_PATH || path.join(os.tmpdir(), 'freenav-link-report.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

// ---------------------------------------------------------------- 链接提取

/** 软件官网外链：data.js 中每条记录独占一行，逐行提取 id 与 url */
function extractToolLinks() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8');
  const out = [];
  for (const line of src.split('\n')) {
    const im = line.match(/\{\s*id:\s*"([^"]+)"/);
    const um = line.match(/\burl:\s*"([^"]+)"/);
    if (im && um) out.push({ url: um[1], source: 'data.js:' + im[1] });
  }
  return out;
}

/** 站内页面：sitemap.xml 的 <loc>，本地文件存在性验证（不消耗网络） */
function extractSitemapPages() {
  const p = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(p)) return [];
  const xml = fs.readFileSync(p, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1])
    .filter(u => /^https?:\/\/freenav\.net\//i.test(u));
}

/** 站内链接：所有 HTML 的 href/src，本地文件存在性验证 */
function extractInternalLinks() {
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name === '.git' || name === 'node_modules') continue;
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) { walk(full); continue; }
      if (!name.endsWith('.html')) continue;
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      const txt = fs.readFileSync(full, 'utf8');
      const re = /(?:href|src|action)\s*=\s*["']([^"']+)["']/gi;
      let m;
      while ((m = re.exec(txt))) {
        const v = m[1];
        if (!v || /^(?:#|https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(v)) continue;
        const clean = v.split('#')[0].split('?')[0];
        if (!clean || /\.(?:png|jpe?g|svg|ico|webp|gif|woff2?|css|js)$/i.test(clean)) continue;
        out.push({ link: clean, source: rel });
      }
    }
  }
  walk(ROOT);
  return out;
}

/**
 * 把站内 URL/路径映射到本地文件。
 * 以 / 开头 = 相对仓库根；相对路径 = 相对来源 HTML 文件所在目录。
 * 例：articles/xxx.html 中的 "../manifest.webmanifest" -> ROOT/manifest.webmanifest
 */
function localTarget(link, sourceFile) {
  let p = link.split('#')[0].split('?')[0];
  if (/^https?:\/\//i.test(p)) {
    p = p.replace(/^https?:\/\/freenav\.net\/?/i, '');
  }
  const base = p.startsWith('/') ? ROOT
    : (sourceFile ? path.dirname(path.join(ROOT, sourceFile)) : ROOT);
  p = p.replace(/^\//, '');
  if (!p) p = 'index.html';
  if (p.endsWith('/')) p += 'index.html';
  return path.resolve(base, p);
}

// ---------------------------------------------------------------- 网络请求

function resolveLocation(base, loc) {
  try { return new URL(loc, base).toString(); } catch { return null; }
}

/**
 * 单次请求。返回 { url, status, ok, error? }
 * status 可能是数字或字符串（ERR / TIMEOUT / BADURL / BADPROTO）
 */
function request(url, method, redirectsLeft) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); } catch { resolve({ url, status: 'BADURL', ok: false, error: 'invalid URL' }); return; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      resolve({ url, status: 'BADPROTO', ok: false, error: 'unsupported protocol' }); return;
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(url, { method, timeout: TIMEOUT, headers: HEADERS }, (res) => {
      const status = res.statusCode;
      res.resume(); // 丢弃响应体，避免连接挂起
      if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
        const next = resolveLocation(url, res.headers.location);
        if (next) { resolve(request(next, method, redirectsLeft - 1)); return; }
      }
      resolve({ url, status, ok: status >= 200 && status < 400 });
    });
    req.on('error', (e) => resolve({ url, status: 'ERR', ok: false, error: (e.code || e.message || '').toUpperCase() }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT', ok: false, error: 'ETIMEDOUT' }); });
    req.end();
  });
}

/** 分级判定：确证死链 / 需复核 / 正常 */
function classify(r) {
  if (r.ok) return 'OK';
  const code = String(r.error || '').toUpperCase();
  // DNS 不存在、连接被拒、非法地址 —— 可确证
  if (['ENOTFOUND', 'EAI_AGAIN', 'ENODATA', 'ECONNREFUSED', 'BADURL', 'BADPROTO'].includes(code)) return 'DEAD';
  if (r.status === 404 || r.status === 410) return 'DEAD';
  // 403/401/429/5xx/超时/TLS/其它网络错误 —— 可能是反爬、维护或本地网络，需复核
  return 'REVIEW';
}

/**
 * 对初判 DEAD 的链接做 GET 二次复核。
 * 部分站点 HEAD 返回 404/405 但 GET 正常；二次确认后才最终定级。
 */
async function verifyDead(item) {
  const r2 = await request(item.url, 'GET', MAX_REDIRECTS);
  const cls2 = classify(r2);
  return {
    ...item,
    status: r2.status,
    error: r2.error,
    ok: r2.ok,
    // 二次复核成功 → 恢复正常；仍确证失败 → DEAD；其余 → REVIEW
    cls: cls2,
    rechecked: true,
  };
}

async function mapLimited(items, fn, limit) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------- 主流程

async function main() {
  const started = new Date();
  const tools = extractToolLinks();
  const sitemap = extractSitemapPages();
  const internal = extractInternalLinks();

  console.log('🦅 FreeNav 死链巡检 — ' + started.toISOString().slice(0, 10));
  console.log('='.repeat(46));
  console.log(`软件官网外链: ${tools.length} 个`);
  console.log(`sitemap 页面: ${sitemap.length} 个（本地校验）`);
  console.log(`站内链接:     ${internal.length} 个（本地校验）`);
  console.log('');

  // 1) 本地校验：sitemap 页面与站内链接
  const missingPages = sitemap.filter(u => !fs.existsSync(localTarget(u)));
  const seenInternal = new Set();
  const missingInternal = [];
  for (const it of internal) {
    const key = it.link + '|' + it.source;
    if (seenInternal.has(key)) continue;
    seenInternal.add(key);
    if (!fs.existsSync(localTarget(it.link, it.source))) missingInternal.push(it);
  }
  console.log(`本地校验: sitemap 缺失 ${missingPages.length} 个，站内链接缺失 ${missingInternal.length} 个`);
  process.stdout.write(`\r外链探测: 0/${tools.length}`);

  // 2) 外链探测（HEAD，失败转 GET）
  const probed = await mapLimited(tools, async (item) => {
    let r = await request(item.url, 'HEAD', MAX_REDIRECTS);
    // HEAD 被拒/不支持/与 GET 不一致时，用 GET 复核
    // 404 也需复核：部分站点 HEAD 返回 404 但 GET 正常（如 copilot.tencent.com）
    if (!r.ok && [403, 404, 405, 406, 429, 501].includes(r.status)) {
      r = await request(item.url, 'GET', MAX_REDIRECTS);
    }
    return {
      url: item.url,
      source: item.source,
      status: r.status,
      error: r.error,
      ok: r.ok,
      cls: classify(r),
    };
  }, CONCURRENCY);
  console.log(`\r外链探测: ${probed.length}/${tools.length}  完成`);

  // 3) 对初判 DEAD 的做 GET 二次确认
  const deadCandidates = probed.filter(r => r.cls === 'DEAD');
  const confirmedDead = await mapLimited(deadCandidates, verifyDead, CONCURRENCY);
  const byUrl = new Map(confirmedDead.map(r => [r.url, r]));
  const final = probed.map(r => byUrl.get(r.url) || r);

  const okList = final.filter(r => r.cls === 'OK');
  const deadList = final.filter(r => r.cls === 'DEAD');
  const reviewList = final.filter(r => r.cls === 'REVIEW');

  console.log('\n' + '-'.repeat(46));
  console.log(`✅ 正常:     ${okList.length}`);
  console.log(`🔴 确证死链: ${deadList.length}`);
  console.log(`🟡 需复核:   ${reviewList.length}`);
  console.log('-'.repeat(46));

  if (deadList.length) {
    console.log('\n确证死链（需立即处理）:');
    deadList.forEach(r => console.log(`  [${r.status}] ${r.url}  <- ${r.source}${r.error ? ' — ' + r.error : ''}`));
  } else {
    console.log('\n✅ 未发现确证死链');
  }

  if (reviewList.length) {
    console.log('\n需复核（多为反爬/维护/网络，暂不计入死链）:');
    reviewList.forEach(r => console.log(`  [${r.status}] ${r.url}  <- ${r.source}${r.error ? ' — ' + r.error : ''}`));
  }

  if (missingPages.length) {
    console.log('\n🔴 sitemap 指向的缺失页面:');
    missingPages.forEach(u => console.log('  ' + u));
  }
  if (missingInternal.length) {
    console.log('\n🔴 站内缺失链接:');
    missingInternal.slice(0, 30).forEach(it => console.log(`  ${it.link}  <- ${it.source}`));
    if (missingInternal.length > 30) console.log(`  ... 另有 ${missingInternal.length - 30} 个`);
  }

  // 4) JSON 报告（供 github-script 生成 Issue 正文）
  const report = {
    date: started.toISOString().slice(0, 10),
    counts: {
      tools: tools.length,
      sitemap: sitemap.length,
      internal: internal.length,
      ok: okList.length,
      dead: deadList.length,
      review: reviewList.length,
      missingPages: missingPages.length,
      missingInternal: missingInternal.length,
    },
    dead: deadList.map(r => ({ url: r.url, status: r.status, source: r.source, error: r.error })),
    review: reviewList.map(r => ({ url: r.url, status: r.status, source: r.source, error: r.error })),
    missingPages,
    missingInternal: missingInternal.slice(0, 50),
  };
  try { fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2)); }
  catch (e) { console.error('JSON 报告写入失败: ' + e.message); }
  console.log(`\nJSON 报告: ${REPORT_PATH}`);

  // 5) 真正写入 GITHUB_OUTPUT（上一版的致命缺陷就在这里）
  const outputs = {
    has_dead: deadList.length > 0 || missingPages.length > 0 || missingInternal.length > 0,
    dead_count: deadList.length + missingPages.length + missingInternal.length,
    has_review: reviewList.length > 0,
    review_count: reviewList.length,
  };
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(ghOutput,
      Object.entries(outputs).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
    console.log(`GITHUB_OUTPUT 已写入: ${JSON.stringify(outputs)}`);
  } else {
    console.log(`（本地运行，未写 GITHUB_OUTPUT）结果: ${JSON.stringify(outputs)}`);
  }

  return outputs;
}

main().catch((e) => {
  console.error('巡检异常终止: ' + (e && e.stack ? e.stack : e));
  // 异常时也必须给出 output，避免工作流静默跳过
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'has_dead=true\ndead_count=0\nhas_review=false\nreview_count=0\ncheck_error=true\n');
  }
  process.exitCode = 1;
});
