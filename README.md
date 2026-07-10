# FreeNav · 免费软件导航（静态 MVP）

一个**零后端、零构建、零备案**的免费 / 开源软件导航站。内容精选自 [fmhy.net](https://fmhy.net/) 生态，内置 100+ 款软件、10 大分类、4 个差异化专题（对比表 + 测评）、客户端搜索与筛选、结构化数据（JSON-LD）、robots/sitemap，可直接部署到任意静态托管。

## 为什么是静态站
- 去掉数据库 / 登录 / 支付 / 会员 → **没有安全面、没有"免费 VIP 后门"**；
- 纯 HTML/JS 对搜索引擎最友好（内容可直接被爬取）；
- 托管费用 ≈ 仅域名钱（~¥60/年），Vercel / Cloudflare Pages / GitHub Pages 免费层即可。

## 目录结构
```
FreeNav/
├─ index.html            # 主页（Hero + 搜索 + 分类 + 列表 + 页脚）
├─ privacy.html          # 隐私政策
├─ terms.html            # 服务条款
├─ disclaimer.html       # 免责声明（含推广/赞助披露）
├─ robots.txt
├─ sitemap.xml
├─ assets/
│  ├─ css/style.css
│  └─ js/
│     ├─ config.js       # ★ 站点配置：唯一需改的域名入口（FREENAV_SITE_URL）
│     ├─ data.js         # ★ 单一数据源：分类 + 100+ 款软件
│     ├─ columns.js      # 4 个差异化专题（axis / 对比表 / 测评）
│     ├─ app.js          # 渲染 / 搜索 / 筛选 / JSON-LD
│     └─ column-render.js# 栏目页渲染
├─ columns/              # 4 个专题静态页（opensource-alt / newbie / design / local-ai）
├─ favicon.svg
├─ 404.html
└─ scripts/
   └─ sync.mjs           # 从 fmhy.net 拉取最新条目，辅助同步
```

## 本地预览
```bash
cd FreeNav
python -m http.server 4173
# 浏览器打开 http://localhost:4173
```

## 部署（三选一，均免费）
- **Cloudflare Pages**：连接 Git 仓库，构建命令留空、输出目录设为 `.`（根目录），绑定域名即可；
- **Vercel**：导入仓库，Framework 选 "Other"，Output 为根目录；
- **GitHub Pages**：把本目录推到仓库，开启 Pages（root）。注意 SPA 无需特殊配置，因为本站是单页锚点。

## 上线前必改的占位符
1. 全站把占位域名 `freenav.example.com` 替换为你的真实域名（如 `https://freenav.com`）。涉及：`index.html`、`sitemap.xml`、`robots.txt`、4 个栏目页的 `<link rel="canonical">`，以及 `assets/js/config.js` 里的 `FREENAV_SITE_URL`（JS 驱动的 canonical / JSON-LD 从这里读取）；
2. 页脚与法律页里的联系邮箱 `contact@freenav.example.com` → 你的真实邮箱；
3. 启用分析：把 `index.html` 中 Cloudflare Web Analytics 的注释取消，替换 `YOUR_TOKEN_HERE`（免费、隐私友好）；
4. 如需真实赞助收入，把 `index.html` 里 `#sponsor` 的占位文案换成赞助商链接（务必标注"赞助/推广"）。

## 如何维护内容（100 款如何增减）
所有数据在 **`assets/js/data.js`** 这一个文件：
- `FREENAV_CATEGORIES`：分类（key / 中文名 / 图标 / 简介）；
- `FREENAV_SOFTWARE`：软件数组，每条含 `name / cat / desc / url / pricing / platforms / tags`。

**增删一款**：直接在数组里加 / 删一个对象即可，无需构建。建议：
- `url` 优先填**官方网站或 GitHub**（比 fmhy 深链更稳定，链接不易失效）；
- `desc` 用**中文利益导向文案**（用户为什么要用它）；
- `tags` 写 2–3 个中文词，影响搜索命中。

## 软件链接如何"同步"
fmhy.net 自己也在频繁更新，你的清单也需要偶尔刷新。两条路径：

**A. 手动（推荐个人站）**
每季度花半小时，对比 fmhy.net 对应分类，更新失效链接、补入新工具。因为链接指向官方源，链接腐烂本就较慢。

**B. 半自动辅助（`scripts/sync.mjs`）**
```bash
node scripts/sync.mjs            # 默认拉取 fmhy GitHub 索引，导出 markdown 链接清单
node scripts/sync.mjs <某个分类URL>  # 拉取指定页面
```
脚本会把页面里的 `[名称](链接)` 抽取成清单打印出来，作为你**人工核对 / 补录**的底稿（FMHY 结构会变，故不自动写入 data.js，需你审阅后合并）。

## 变现（先流量后收费）
- **赞助广告位**：首页 `#sponsor` 区块，日 PV 过千后可招商（小众软件厂商常愿花几百块买推荐位）；
- **CPS 联盟**：在 `data.js` 给相应软件加 `affiliateUrl` 字段，并在 `app.js` 优先用它跳转（当前用 `url`）；
- **会员订阅**：暂未做。等日均 UV 稳定 200+ 且决定备案后，再考虑加回（需同时补支付与权限安全）。

## SEO 要点
- 已内置 per-page `<title>`/description/OG + 全站 `ItemList` JSON-LD；
- 想进一步加分：把热门分类拆成独立静态页（如 `/cat/ai.html`）、持续写"XX 替代品""XX 免费方案"长尾文章、做外链。
