# FreeNav · Free & Open-Source Software Directory

**A human-curated directory of genuinely free, open-source software — with comparison tables and hands-on reviews to help you decide.**

> 🔗 Live sites: **English** → [freenav.net/en](https://freenav.net/en/) ｜ **中文** → [freenav.net](https://freenav.net/)

FreeNav is not an ad-stuffed aggregator. We do one thing: present genuinely free, open-source tools, cleanly — no cracks, no subscriptions, no tracking.

## ✨ What you get

- **128 hand-picked apps** across **11 categories** — System, Office & Docs, Design, Development, Media, Download, AI, Security & Privacy, Learning, Mobile, and China-made AI.
- **Deep-dive columns** — e.g. [Open-Source / Free Alternatives](https://freenav.net/en/columns/opensource-alt.html) — with scored comparison tables, difficulty ratings, pros/cons and real hands-on reviews.
- **Zero tracking** — no analytics scripts, no fingerprinting. Only anonymous visit counts (self-hosted, privacy-friendly).
- **Search & filters** — instant search, category views, platform filtering, favorites ⭐ and a personalized home page (stored only in your browser).
- **PWA ready** — installable on Android / iOS / desktop, works offline via Service Worker.
- **Dark / light themes**, RSS feed, sitemap, fully static & fast.

## 🚀 Try it

| | URL |
|---|---|
| 🌍 English | https://freenav.net/en/ |
| 🇨🇳 中文 | https://freenav.net/ |
| 📝 Column example | https://freenav.net/en/columns/opensource-alt.html |

## 🧱 Tech stack

Pure static site — **HTML + CSS + Vanilla JS**. No framework, no backend, no database, no build step required to run.

- Single source of truth: `assets/js/data.min.js` (software data), `assets/js/columns.min.js` (column data)
- Rendering: `app.min.js` (home/search/categories) + `column-render.min.js` (column pages)
- Hosted on **GitHub Pages** with custom domain (`CNAME` → freenav.net)
- Deployable to GitHub Pages / Cloudflare Pages / Vercel / any static host

## 📁 Structure (simplified)

```
FreeNav/
├─ index.html            # Home (hero + search + categories + tools + columns + footer)
├─ tools.html            # Full tool list
├─ blog.html             # Deep-dive columns & articles index
├─ columns/              # Column pages
├─ articles/             # Long-form reviews & guides
├─ en/                   # 🌍 English version (self-contained)
├─ assets/
│  ├─ css/style.css      # styles (+ style.min.css)
│  └─ js/                # data + render scripts (minified)
├─ manifest.webmanifest  # PWA manifest
├─ sw.js                 # Service Worker (offline cache)
├─ rss.xml / sitemap.xml / robots.txt
└─ CNAME                 # freenav.net
```

## ▶️ Local preview

```bash
cd FreeNav
python -m http.server 4173
# open http://localhost:4173
```

## 🛠️ Maintain data

All software entries live in **`assets/js/data.min.js`** (columns in `columns.min.js`). Add / edit / remove an object and refresh — done. The `en/` copy is generated from the same data (see `en/` assets).

## 🤝 Contribute

- Found a useful free/open-source tool that's missing? Open a GitHub Issue, or reach out via the site (专栏投稿入口).
- Want a deep-dive column written? Propose it in Issues — comparison table + hands-on review, no paywalled fluff.
- Code improvements (a11y, i18n, PWA) are very welcome. MIT licensed.

## 📜 License

[MIT](./LICENSE) — free to use, modify and distribute (including commercially). Keep the copyright notice.

## 🙏 Credits

Inspired by and referencing [fmhy.net](https://fmhy.net/) (Free Media Heck Yeah) and the wider open-source ecosystem.

---

## 中文简介 🇨🇳

FreeNav 是一个**人工精选、深度测评**的免费 / 开源软件导航站：收录 **128 款**免费开源软件，覆盖 **11 大使用场景**，提供对比表与实测测评帮你做决定。**无追踪、纯静态、MIT 开源**，中文站 [freenav.net](https://freenav.net/)，英文版 [freenav.net/en](https://freenav.net/en/)。欢迎提 Issue 推荐软件或投稿专栏。
