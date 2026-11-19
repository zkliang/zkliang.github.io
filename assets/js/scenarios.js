/* FreeNav 场景选型器数据：每个场景 = 一组精确引用的工具 id + 决策说明 */
window.FREENAV_SCENARIOS = [
  {
    id: "new-pc",
    icon: "🖥️",
    title: "新电脑装必备",
    sub: "干净、无捆绑、开箱即用的一套基础软件",
    tools: ["everything", "powertoys", "7zip", "sharex", "flowlauncher", "bitwarden"],
   note: "文件搜索、窗口增强、解压、截图、启动器、密码管理——先装这六款，再把日常软件逐个换过来。"
  },
  {
    id: "local-ai",
    icon: "🤖",
    title: "本地跑大模型",
    sub: "数据不出本机，零账单地把 AI 用起来",
    tools: ["ollama", "lmstudio", "openwebui", "anythingllm", "whisper"],
    note: "想省事用 LM Studio 或 Ollama；要网页界面配 Open WebUI；要带着私有文档聊天用 AnythingLLM；语音转写交给 Whisper。"
  },
  {
    id: "no-adobe",
    icon: "🎨",
    title: "摆脱 Adobe 订阅",
    sub: "修图、矢量、排版、剪辑、录屏的免费替代",
    tools: ["gimp", "inkscape", "darktable", "shotcut", "obs", "scribus"],
    note: "GIMP 对应 PS、Inkscape 对应 AI、Scribus 对应 InDesign、Shotcut 做剪辑、OBS 录屏——覆盖绝大多数人真正用到的功能。"
  },
  {
    id: "privacy",
    icon: "🛡️",
    title: "隐私加固",
    sub: "少被追踪、少被画像，把数据握回自己手里",
    tools: ["ublockorigin", "privacybadger", "bitwarden", "signal", "veracrypt", "portmaster"],
    note: "浏览器先装 uBlock Origin 与 Privacy Badger；密码用 Bitwarden；聊天用 Signal；敏感文件放 VeraCrypt 加密卷。"
  },
  {
    id: "student",
    icon: "📚",
    title: "学生党效率包",
    sub: "记笔记、读文献、背单词、看公开课",
    tools: ["obsidian", "zotero", "anki", "duolingo", "gutenberg", "khanacademy"],
    note: "Obsidian 记笔记、Zotero 管文献、Anki 背单词，再配上古登堡的免费电子书与可汗学院的公开课，足够撑起整个学习流程。"
  },
  {
    id: "media-server",
    icon: "🎬",
    title: "自建影音中心",
    sub: "把散落的片子整理成自己的 Netflix",
    tools: ["jellyfin", "vlc", "mpv", "ffmpeg", "kodi"],
    note: "Jellyfin 做服务端与海报墙，VLC/mpv 做播放，ffmpeg 转码压制，Kodi 适合客厅电视端。"
  },
  {
    id: "download",
    icon: "⬇️",
    title: "下载与传输",
    sub: "BT、网盘直链、视频抓取、批量下载全覆盖",
    tools: ["qbittorrent", "motrix", "aria2", "ytdlp", "jdownloader", "localsend"],
    note: "常驻做种用 qBittorrent；通用下载用 Motrix/Aria2；视频用 yt-dlp；设备间互传用 Localsend。"
  },
  {
    id: "dev-setup",
    icon: "💻",
    title: "开发者装机",
    sub: "编辑器、版本控制、数据库、容器、远程连接",
    tools: ["vscode", "git", "dbeaver", "docker", "postman", "warp"],
    note: "VS Code 加 Git 是基本盘；数据库用 DBeaver；Docker 跑环境；Postman 调接口；Warp 做终端。"
  }
];
