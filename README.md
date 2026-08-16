# FreeNav · 人工精选的免费开源软件导航

一个**人工精选、深度测评、帮你做决定**的免费 / 开源软件导航站。零追踪、纯静态、可白嫖部署。

- 收录 **128 款**经过筛选的免费 / 开源软件，覆盖 **11 大使用场景**，另有 **5 个深度专题**（对比表 + 测评）；
- 中文优先 · 开源优先 · **无追踪**（不含任何追踪脚本，仅有匿名访问计数）；
- 纯静态（HTML / CSS / Vanilla JS，无框架、无后端、无数据库）；
- 可托管到 GitHub Pages / Cloudflare Pages / Vercel / 任意静态空间；
- 以 **MIT 协议**开源，欢迎 Fork 与二次开发。

## 开源协议

[./LICENSE](./LICENSE)（MIT）——可自由使用、修改、分发（含商业用途），仅需保留版权声明。

## 目录结构

```
FreeNav/
├─ index.html           # 主页（Hero + 搜索 + 分类 + 工具列表 + 专栏带 + 页脚）
├─ tools.html           # 全量工具列表（按场景分类）
├─ tools/index.html     # 同上的目录入口版本
├─ blog.html            # 专栏（深度测评文章入口 + 投稿）
├─ columns/             # 5 个专题静态页
├─ articles/            # 专栏文章
├─ business.html        # 商务 / 赞助合作
├─ shop.html            # 赞助推荐位
├─ privacy.html / terms.html / disclaimer.html / 404.html
├─ assets/
│  ├─ css/style.css (+ style.min.css)
│  └─ js/               # 单一数据源 + 渲染
│     ├─ config.min.js   # 站点配置（域名入口等）
│     ├─ data.min.js     # ★ 软件数据（核心数据源）
│     ├─ columns.min.js  # 专题数据
│     ├─ app.min.js      # 渲染 / 搜索 / 筛选
│     ├─ theme.min.js    # 主题
│     ├─ column-render.min.js
│     ├─ icons.min.js
│     └─ share.min.js    # 分享栏
├─ scripts/
│  ├─ gen-tools.js      # 生成 tools.html / tools/index.html
│  └─ gen_rss.mjs       # 生成 rss.xml（读取 articles/）
├─ manifest.webmanifest # PWA 清单
├─ sw.js                # Service Worker（离线缓存）
├─ sw-register.js
├─ rss.xml / sitemap.xml / robots.txt
└─ CNAME                # freenav.net
```

## 本地预览

```bash
cd FreeNav
python -m http.server 4173
# 浏览器打开 http://localhost:4173
```

## 部署

- **GitHub Pages**：把本目录推到仓库，Settings → Pages 选 root；已含 `CNAME`，绑定 `freenav.net` 即可；
- **Cloudflare Pages / Vercel**：导入仓库，输出目录设为 `.`（根目录），构建命令留空。

## 维护数据

所有软件数据集中在 **`assets/js/data.min.js`**（专题数据在 `columns.min.js`）。增删一款软件：直接在数据数组里加 / 删对象即可，刷新即生效。如需压缩可重新 minify。

## 脚本

- `scripts/gen-tools.js`：重新生成 `tools.html` / `tools/index.html`；
- `scripts/gen_rss.mjs`：重新生成 `rss.xml`（读取 `articles/` 下文章，而非工具列表）。

## 免责声明

- 软件版权归各自作者所有，本站仅做整理与推荐；
- 站点不含追踪脚本，不收集用户行为；
- 部分页面含赞助 / 联盟推广链接，均已明确标注"推广 / 赞助"。

## 致谢

候选清单与灵感参考 [fmhy.net](https://fmhy.net/) 开源生态。
