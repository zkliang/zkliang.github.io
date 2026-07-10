/*
 * FreeNav 数据层 —— 单一数据源（single source of truth）
 * 内容精选自 fmhy.net（Free Media Heck Yeah）同生态的免费 / 开源软件清单。
 * 同步方式见 README.md 与 scripts/sync.mjs。
 *
 * 字段说明：
 *  id        唯一标识
 *  name      软件名
 *  cat       分类 key（见 FREENAV_CATEGORIES）
 *  desc      中文价值文案（利益导向，1-2 句）
 *  url       官方网站 / GitHub / 项目主页（优先官方源，链接更稳定）
 *  pricing   免费 | 开源 | 免费增值
 *  platforms Win | Mac | Linux | Web | Android | iOS | 自托管
 *  tags      中文标签，用于搜索与筛选
 */

window.FREENAV_CATEGORIES = [
  { key: "system",   label: "系统工具",   icon: "🛠️", color: "#38bdf8", color2: "#0284c7", desc: "清理、搜索、启动盘与效率启动器，让电脑干净又好用。" },
  { key: "office",   label: "办公 & 文档", icon: "📝", color: "#34d399", color2: "#059669", desc: "笔记、密码、PDF 与办公套件，告别臃肿订阅与广告弹窗。" },
  { key: "design",   label: "设计 & 创作", icon: "🎨", color: "#f472b6", color2: "#db2777", desc: "修图、插画、3D、剪辑与排版，开源也能做出专业作品。" },
  { key: "dev",      label: "开发 & 编程", icon: "💻", color: "#818cf8", color2: "#4f46e5", desc: "编辑器、版本控制、数据库与部署，开发者日常工具箱。" },
  { key: "media",    label: "影音 & 媒体", icon: "🎬", color: "#fb7185", color2: "#e11d48", desc: "万能播放、私有影音库与转码，自己的媒体自己说了算。" },
  { key: "download", label: "下载 & 传输", icon: "⬇️", color: "#fbbf24", color2: "#d97706", desc: "BT、多线程与在线视频下载，高速且清爽无广告。" },
  { key: "ai",       label: "AI & 智能",  icon: "🤖", color: "#a78bfa", color2: "#7c3aed", desc: "本地大模型、文生图与知识库，把 AI 跑在你自己的机器上。" },
  { key: "security", label: "安全 & 隐私", icon: "🔒", color: "#2dd4bf", color2: "#0d9488", desc: "VPN、加密通讯与密码管理，守住你的数据与身份。" },
  { key: "study",    label: "学习 & 教育", icon: "📚", color: "#fb923c", color2: "#ea580c", desc: "记忆卡、文献、公版书与公开课，免费把知识装进口袋。" },
  { key: "mobile",   label: "移动 & 安卓", icon: "📱", color: "#4ade80", color2: "#16a34a", desc: "开源安卓商店与无广告客户端，手机也能清爽自由。" },
];

window.FREENAV_SOFTWARE = [
  // ───────── 系统工具 ─────────
  { id: "everything", name: "Everything", cat: "system", desc: "极速本地文件搜索，输入即出，秒级定位任意文件。", url: "https://www.voidtools.com/", pricing: "免费", platforms: ["Win"], tags: ["文件搜索", "效率", "轻量"] },
  { id: "powertoys", name: "PowerToys", cat: "system", desc: "微软官方系统增强套件，窗口布局、批量重命名、取色等 20+ 工具。", url: "https://github.com/microsoft/PowerToys", pricing: "开源", platforms: ["Win"], tags: ["微软", "效率", "窗口"] },
  { id: "sharex", name: "ShareX", cat: "system", desc: "强大截图与录屏，支持滚动截图、OCR、一键上传图床。", url: "https://getsharex.com/", pricing: "开源", platforms: ["Win"], tags: ["截图", "录屏", "OCR"] },
  { id: "7zip", name: "7-Zip", cat: "system", desc: "老牌开源压缩工具，支持 7z/zip/rar，压缩率高、体积小。", url: "https://7-zip.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["压缩", "解压"] },
  { id: "ventoy", name: "Ventoy", cat: "system", desc: "把 U 盘做成多系统启动盘，ISO 直接拖入即可引导，重装神器。", url: "https://www.ventoy.net/", pricing: "开源", platforms: ["Win", "Linux"], tags: ["启动盘", "装机"] },
  { id: "rufus", name: "Rufus", cat: "system", desc: "轻量启动盘制作工具，制作 Windows/Linux 安装盘最快最稳。", url: "https://rufus.ie/", pricing: "开源", platforms: ["Win"], tags: ["启动盘", "装机"] },
  { id: "crystaldiskinfo", name: "CrystalDiskInfo", cat: "system", desc: "硬盘健康监控，读取 S.M.A.R.T 提前预警坏道。", url: "https://crystalmark.info/", pricing: "免费", platforms: ["Win"], tags: ["硬盘", "监控"] },
  { id: "bleachbit", name: "BleachBit", cat: "system", desc: "系统清理与隐私擦除，释放空间、清除使用痕迹。", url: "https://www.bleachbit.org/", pricing: "开源", platforms: ["Win", "Linux"], tags: ["清理", "隐私"] },
  { id: "localsend", name: "LocalSend", cat: "system", desc: "局域网跨平台文件互传，无需联网、无需账号，替代 AirDrop。", url: "https://localsend.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["文件互传", "局域网"] },
  { id: "flowlauncher", name: "Flow Launcher", cat: "system", desc: "类 Alfred 的快捷启动器，搜文件、计算、查词一键直达。", url: "https://flowlauncher.com/", pricing: "开源", platforms: ["Win"], tags: ["启动器", "效率"] },

  // ───────── 办公效率 ─────────
  { id: "libreoffice", name: "LibreOffice", cat: "office", desc: "完整开源办公套件，兼容 Word/Excel/PPT，永久免费无广告。", url: "https://www.libreoffice.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["办公", "替代Office"] },
  { id: "onlyoffice", name: "OnlyOffice", cat: "office", desc: "界面现代的开源办公套件，协作与格式兼容表现出色。", url: "https://www.onlyoffice.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Web"], tags: ["办公", "协作"] },
  { id: "obsidian", name: "Obsidian", cat: "office", desc: "本地优先的双链笔记，Markdown 存储、插件生态丰富，知识管理首选。", url: "https://obsidian.md/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["笔记", "双链", "知识库"] },
  { id: "joplin", name: "Joplin", cat: "office", desc: "开源笔记与待办，端到端加密、支持多端同步。", url: "https://joplinapp.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["笔记", "加密", "待办"] },
  { id: "logseq", name: "Logseq", cat: "office", desc: "大纲式知识库，双向链接 + 白板，适合构建个人 wiki。", url: "https://logseq.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["笔记", "大纲", "知识库"] },
  { id: "bitwarden", name: "Bitwarden", cat: "office", desc: "开源密码管理器，全平台同步、自带密码生成与泄露监测。", url: "https://bitwarden.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS", "Web"], tags: ["密码", "安全"] },
  { id: "keepassxc", name: "KeePassXC", cat: "office", desc: "本地离线密码库，数据完全自持、不依赖云端。", url: "https://keepassxc.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["密码", "离线"] },
  { id: "marktext", name: "MarkText", cat: "office", desc: "优雅的 Markdown 编辑器，实时预览、专注写作无干扰。", url: "https://marktext.app/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["Markdown", "写作"] },
  { id: "standardnotes", name: "Standard Notes", cat: "office", desc: "端到端加密笔记，简洁稳定，适合存敏感信息。", url: "https://standardnotes.com/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Android", "iOS", "Web"], tags: ["笔记", "加密"] },
  { id: "stirlingpdf", name: "Stirling-PDF", cat: "office", desc: "自托管 PDF 工具箱，合并/拆分/转换/加水印一站搞定。", url: "https://github.com/Stirling-Tools/Stirling-PDF", pricing: "开源", platforms: ["Web", "自托管"], tags: ["PDF", "转换"] },

  // ───────── 设计创作 ─────────
  { id: "gimp", name: "GIMP", cat: "design", desc: "开源版 Photoshop，修图、绘图、图层全支持。", url: "https://www.gimp.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["修图", "替代PS"] },
  { id: "inkscape", name: "Inkscape", cat: "design", desc: "矢量绘图利器，SVG 原生，Logo/插画首选。", url: "https://inkscape.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["矢量", "Logo"] },
  { id: "krita", name: "Krita", cat: "design", desc: "专业开源数字绘画，画笔引擎强、适合插画与概念图。", url: "https://krita.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android"], tags: ["绘画", "插画"] },
  { id: "blender", name: "Blender", cat: "design", desc: "全流程 3D 创作，建模/雕刻/动画/渲染一体。", url: "https://www.blender.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["3D", "建模", "动画"] },
  { id: "darktable", name: "Darktable", cat: "design", desc: "开源 RAW 后期，类似 Lightroom 的非破坏性编辑。", url: "https://www.darktable.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["修图", "RAW"] },
  { id: "audacity", name: "Audacity", cat: "design", desc: "老牌开源音频编辑，录音/降噪/剪辑够用。", url: "https://www.audacityteam.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["音频", "录音"] },
  { id: "obs", name: "OBS Studio", cat: "design", desc: "直播与录屏标配，开源免费、插件丰富。", url: "https://obsproject.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["录屏", "直播"] },
  { id: "shotcut", name: "Shotcut", cat: "design", desc: "跨平台视频剪辑，多轨道、滤镜齐全、上手快。", url: "https://shotcut.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["剪辑", "视频"] },
  { id: "scribus", name: "Scribus", cat: "design", desc: "开源桌面出版，排版印刷级，替代 InDesign 做小册子。", url: "https://www.scribus.net/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["排版", "出版"] },
  { id: "pencil2d", name: "Pencil2D", cat: "design", desc: "轻量 2D 手绘动画，界面简单适合入门。", url: "https://www.pencil2d.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["动画", "手绘"] },
  { id: "fontforge", name: "FontForge", cat: "design", desc: "开源字体编辑器，创建 / 修改字体、导出多种格式。", url: "https://fontforge.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["字体", "编辑"] },

  // ───────── 开发编程 ─────────
  { id: "vscode", name: "VS Code", cat: "dev", desc: "微软开源编辑器，插件生态无敌，前后端通吃。", url: "https://code.visualstudio.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["编辑器", "IDE"] },
  { id: "git", name: "Git", cat: "dev", desc: "版本控制事实标准，所有协作流程的基石。", url: "https://git-scm.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["版本控制"] },
  { id: "githubdesktop", name: "GitHub Desktop", cat: "dev", desc: "官方图形化 Git 客户端，新手友好。", url: "https://desktop.github.com/", pricing: "免费", platforms: ["Win", "Mac"], tags: ["Git", "图形化"] },
  { id: "postman", name: "Postman", cat: "dev", desc: "API 调试与测试，集合管理、文档生成一站搞定。", url: "https://www.postman.com/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Web"], tags: ["API", "调试"] },
  { id: "dbeaver", name: "DBeaver", cat: "dev", desc: "通用数据库客户端，连 MySQL/Postgres/SQLite 等几十种库。", url: "https://dbeaver.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["数据库", "SQL"] },
  { id: "docker", name: "Docker", cat: "dev", desc: "容器化部署标准，环境一致、一键起服务。", url: "https://www.docker.com/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux"], tags: ["容器", "部署"] },
  { id: "neovim", name: "Neovim", cat: "dev", desc: "现代化 Vim，Lua 配置、LSP 加持，极客编辑器。", url: "https://neovim.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["编辑器", "终端"] },
  { id: "tailscale", name: "Tailscale", cat: "dev", desc: "零配置内网穿透 VPN，把设备组进私有局域网。", url: "https://tailscale.com/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["内网穿透", "VPN"] },
  { id: "warp", name: "Warp", cat: "dev", desc: "智能终端，命令补全与可分享块，Shell 体验升级。", url: "https://www.warp.dev/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux"], tags: ["终端", "效率"] },
  { id: "ohmyzsh", name: "Oh My Zsh", cat: "dev", desc: "Zsh 配置框架，主题插件让命令行好用又好看。", url: "https://ohmyz.sh/", pricing: "开源", platforms: ["Mac", "Linux"], tags: ["终端", "配置"] },

  // ───────── 影音播放 ─────────
  { id: "vlc", name: "VLC", cat: "media", desc: "万能播放器，几乎通吃所有格式，无广告无间谍。", url: "https://www.videolan.org/vlc/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["播放器", "万能"] },
  { id: "mpv", name: "MPV", cat: "media", desc: "极简高性能播放器，快捷键党与二次开发首选。", url: "https://mpv.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["播放器", "轻量"] },
  { id: "potplayer", name: "PotPlayer", cat: "media", desc: "轻量强大的 Windows 播放器，解码与字幕体验佳。", url: "https://potplayer.daum.net/", pricing: "免费", platforms: ["Win"], tags: ["播放器", "字幕"] },
  { id: "foobar2000", name: "foobar2000", cat: "media", desc: "高保真音乐播放器，音质与自定义界面临界点。", url: "https://www.foobar2000.org/", pricing: "免费", platforms: ["Win", "Android"], tags: ["音乐", "高保真"] },
  { id: "jellyfin", name: "Jellyfin", cat: "media", desc: "开源私人影音库，自建 Netflix，无订阅无限制。", url: "https://jellyfin.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS", "自托管"], tags: ["影音库", "自托管"] },
  { id: "kodi", name: "Kodi", cat: "media", desc: "家庭影院中心，统一管理电影音乐、支持插件。", url: "https://kodi.tv/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["家庭影院", "媒体中心"] },
  { id: "handbrake", name: "HandBrake", cat: "media", desc: "开源视频转码，压片清晰、预设丰富。", url: "https://handbrake.fr/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["转码", "压缩"] },
  { id: "musicbrainzpicard", name: "MusicBrainz Picard", cat: "media", desc: "音频元数据自动整理，给曲库批量洗标签。", url: "https://picard.musicbrainz.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["音乐", "整理"] },
  { id: "ffmpeg", name: "ffmpeg", cat: "media", desc: "命令行音视频瑞士军刀，转换/截取/录制的底层引擎。", url: "https://ffmpeg.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["音视频", "命令行"] },
  { id: "plex", name: "Plex", cat: "media", desc: "媒体服务器，远程串流你的影音库，免费版够用。", url: "https://www.plex.tv/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Android", "iOS", "自托管"], tags: ["影音库", "串流"] },

  // ───────── 下载工具 ─────────
  { id: "qbittorrent", name: "qBittorrent", cat: "download", desc: "无广告开源 BT 客户端，搜索与做种稳定。", url: "https://www.qbittorrent.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["BT", "无广告"] },
  { id: "transmission", name: "Transmission", cat: "download", desc: "轻量 BT 客户端，占用低、适合常驻做种。", url: "https://transmissionbt.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["BT", "轻量"] },
  { id: "motrix", name: "Motrix", cat: "download", desc: "全协议下载器，界面现代，支持 HTTP/BT/磁力。", url: "https://motrix.app/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["多线程", "BT"] },
  { id: "fdm", name: "Free Download Manager", cat: "download", desc: "多线程下载加速，断点续传、站点抓取。", url: "https://www.freedownloadmanager.org/", pricing: "免费", platforms: ["Win", "Mac"], tags: ["多线程", "加速"] },
  { id: "jdownloader", name: "JDownloader", cat: "download", desc: "网盘/批量下载利器，自动解压与验证码识别。", url: "https://jdownloader.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["网盘", "批量"] },
  { id: "aria2", name: "Aria2", cat: "download", desc: "命令行多协议下载内核，配合前端做离线下载。", url: "https://aria2.github.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["命令行", "离线下载"] },
  { id: "ytdlp", name: "yt-dlp", cat: "download", desc: "视频下载命令行神器，更新极快、支持海量站点。", url: "https://github.com/yt-dlp/yt-dlp", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["视频", "命令行"] },
  { id: "persepolis", name: "Persepolis", cat: "download", desc: "Aria2 的图形前端，下载管理更直观。", url: "https://persepolisdm.github.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["图形化", "Aria2"] },
  { id: "downzemall", name: "DownZemAll", cat: "download", desc: "开源下载管理器，批量抓取页面里的所有链接。", url: "https://github.com/liberodark/DownZemAll", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["批量", "抓取"] },
  { id: "cobalt", name: "Cobalt", cat: "download", desc: "开源在线媒体下载器，粘贴链接即得视频/音频，干净无广告。", url: "https://cobalt.tools/", pricing: "开源", platforms: ["Web"], tags: ["在线", "视频"] },

  // ───────── AI 工具 ─────────
  { id: "ollama", name: "Ollama", cat: "ai", desc: "本地运行大模型最简单方式，一行命令跑 Llama/Mistral。", url: "https://ollama.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["本地大模型", "LLM"] },
  { id: "lmstudio", name: "LM Studio", cat: "ai", desc: "图形化本地模型管理，下载/聊天/API 一体。", url: "https://lmstudio.ai/", pricing: "免费", platforms: ["Win", "Mac", "Linux"], tags: ["本地大模型", "GUI"] },
  { id: "openwebui", name: "Open WebUI", cat: "ai", desc: "自托管 ChatGPT 式界面，对接 Ollama/任意模型。", url: "https://github.com/open-webui/open-webui", pricing: "开源", platforms: ["Web", "自托管"], tags: ["聊天界面", "自托管"] },
  { id: "comfyui", name: "ComfyUI", cat: "ai", desc: "节点式 Stable Diffusion 工作流，出图可控可复现。", url: "https://www.comfy.org/", pricing: "开源", platforms: ["Win", "Linux"], tags: ["文生图", "节点"] },
  { id: "jan", name: "Jan", cat: "ai", desc: "本地 AI 聊天桌面端，模型商店与隐私优先。", url: "https://jan.ai/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["本地大模型", "桌面"] },
  { id: "anythingllm", name: "AnythingLLM", cat: "ai", desc: "全栈本地知识库，把文档喂给私有 GPT。", url: "https://anythingllm.com/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "自托管"], tags: ["知识库", "RAG"] },
  { id: "upscayl", name: "Upscayl", cat: "ai", desc: "开源 AI 图片放大，老照片/低清图一键清晰化。", url: "https://www.upscayl.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["放大", "图片"] },
  { id: "whisper", name: "Whisper", cat: "ai", desc: "OpenAI 开源语音转文字，本地转写多语种字幕。", url: "https://github.com/openai/whisper", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["语音识别", "字幕"] },
  { id: "sdwebui", name: "Stable Diffusion WebUI", cat: "ai", desc: "最流行的本地文生图界面（AUTOMATIC1111）。", url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui", pricing: "开源", platforms: ["Win", "Linux"], tags: ["文生图", "本地"] },
  { id: "pinokio", name: "Pinokio", cat: "ai", desc: "一键安装 AI 应用商店，ComfyUI/模型自动配环境。", url: "https://pinokio.computer/", pricing: "免费", platforms: ["Win", "Mac", "Linux"], tags: ["AI商店", "一键"] },
  { id: "localai", name: "LocalAI", cat: "ai", desc: "自托管 OpenAI 兼容推理服务，消费级硬件跑大模型。", url: "https://localai.io/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "自托管"], tags: ["推理", "API"] },

  // ───────── 安全隐私 ─────────
  { id: "protonvpn", name: "Proton VPN", cat: "security", desc: "瑞士隐私 VPN，免费版不限流量、无日志。", url: "https://protonvpn.com/", pricing: "免费增值", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["VPN", "隐私"] },
  { id: "torbrowser", name: "Tor Browser", cat: "security", desc: "匿名浏览，多层加密绕开审查，保护身份。", url: "https://www.torproject.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["匿名", "浏览"] },
  { id: "signal", name: "Signal", cat: "security", desc: "端到端加密通讯，默认收集极少、安全标杆。", url: "https://signal.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["加密通讯", "隐私"] },
  { id: "protonmail", name: "Proton Mail", cat: "security", desc: "加密邮箱，瑞士服务器、隐私友好。", url: "https://proton.me/mail", pricing: "免费增值", platforms: ["Web", "Win", "Mac", "Android", "iOS"], tags: ["邮箱", "加密"] },
  { id: "simplelogin", name: "SimpleLogin", cat: "security", desc: "邮箱别名服务，注册网站用一次性地址防追踪。", url: "https://simplelogin.io/", pricing: "开源", platforms: ["Web", "Android", "iOS"], tags: ["邮箱别名", "防追踪"] },
  { id: "ublockorigin", name: "uBlock Origin", cat: "security", desc: "高效广告与追踪拦截，省流量、护隐私。", url: "https://github.com/gorhill/uBlock-Origin", pricing: "开源", platforms: ["Web"], tags: ["广告拦截", "插件"] },
  { id: "portmaster", name: "Portmaster", cat: "security", desc: "开源应用防火墙，可视化监控每个程序的网络连接。", url: "https://safing.io/portmaster/", pricing: "开源", platforms: ["Win", "Linux"], tags: ["防火墙", "监控"] },
  { id: "veracrypt", name: "VeraCrypt", cat: "security", desc: "开源磁盘加密，创建加密卷隐藏敏感数据。", url: "https://www.veracrypt.fr/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["加密", "磁盘"] },
  { id: "gnupg", name: "GnuPG", cat: "security", desc: "命令行加密与签名，邮件/文件验证基石。", url: "https://gnupg.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux"], tags: ["加密", "签名"] },
  { id: "privacybadger", name: "Privacy Badger", cat: "security", desc: "EFF 出品的反追踪插件，自动学习屏蔽跟踪器。", url: "https://privacybadger.org/", pricing: "开源", platforms: ["Web"], tags: ["反追踪", "插件"] },

  // ───────── 学习资源 ─────────
  { id: "anki", name: "Anki", cat: "study", desc: "间隔重复记忆卡，背单词/备考神器，开源同步。", url: "https://apps.ankiweb.net/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["记忆卡", "备考"] },
  { id: "zotero", name: "Zotero", cat: "study", desc: "开源文献管理，一键抓取论文、生成引用。", url: "https://www.zotero.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Web"], tags: ["文献", "引用"] },
  { id: "gutenberg", name: "Project Gutenberg", cat: "study", desc: "超 7 万本公版电子书，永久免费下载。", url: "https://www.gutenberg.org/", pricing: "免费", platforms: ["Web"], tags: ["电子书", "公版"] },
  { id: "khanacademy", name: "Khan Academy", cat: "study", desc: "免费系统化学科课程，K12 到大学全覆盖。", url: "https://www.khanacademy.org/", pricing: "免费", platforms: ["Web", "Android", "iOS"], tags: ["课程", "K12"] },
  { id: "duolingo", name: "Duolingo", cat: "study", desc: "游戏化语言学习，零基础入门最轻松。", url: "https://www.duolingo.com/", pricing: "免费增值", platforms: ["Web", "Android", "iOS"], tags: ["语言", "游戏化"] },
  { id: "openstax", name: "OpenStax", cat: "study", desc: "免费开源教材，大学课程教科书可下载。", url: "https://openstax.org/", pricing: "免费", platforms: ["Web"], tags: ["教材", "大学"] },
  { id: "standardebooks", name: "Standard Ebooks", cat: "study", desc: "精排公版书，排版考究、EPUB 干净。", url: "https://standardebooks.org/", pricing: "免费", platforms: ["Web"], tags: ["电子书", "精排"] },
  { id: "coursera", name: "Coursera", cat: "study", desc: "名校公开课平台，大量免费旁听课程。", url: "https://www.coursera.org/", pricing: "免费增值", platforms: ["Web", "Android", "iOS"], tags: ["公开课", "名校"] },

  // ───────── 移动应用 ─────────
  { id: "fdroid", name: "F-Droid", cat: "mobile", desc: "开源安卓应用商店，无追踪、可验证构建。", url: "https://f-droid.org/", pricing: "开源", platforms: ["Android"], tags: ["应用商店", "开源"] },
  { id: "aurora", name: "Aurora Store", cat: "mobile", desc: "匿名从 Play 商店下载应用，免谷歌账号。", url: "https://auroraoss.com/", pricing: "开源", platforms: ["Android"], tags: ["应用商店", "匿名"] },
  { id: "newpipe", name: "NewPipe", cat: "mobile", desc: "轻量 YouTube 客户端，无广告、可后台播放下载。", url: "https://newpipe.net/", pricing: "开源", platforms: ["Android"], tags: ["YouTube", "无广告"] },
  { id: "organicmaps", name: "Organic Maps", cat: "mobile", desc: "开源离线地图，无遥测、省电，徒步导航好用。", url: "https://organicmaps.app/", pricing: "开源", platforms: ["Android", "iOS"], tags: ["地图", "离线"] },
  { id: "kdeconnect", name: "KDE Connect", cat: "mobile", desc: "手机电脑无缝互联，通知同步/文件互传。", url: "https://kdeconnect.kde.org/", pricing: "开源", platforms: ["Win", "Mac", "Linux", "Android", "iOS"], tags: ["互联", "文件互传"] },
  { id: "simplemobile", name: "Simple Mobile Tools", cat: "mobile", desc: "开源安卓基础应用套件（相册/计算器/文件）。", url: "https://www.simplemobiletools.com/", pricing: "开源", platforms: ["Android"], tags: ["套件", "基础应用"] },
  { id: "librera", name: "Librera Reader", cat: "mobile", desc: "安卓电子书阅读器，格式全、自定义强。", url: "https://librera.ml/", pricing: "开源", platforms: ["Android"], tags: ["阅读器", "电子书"] },
  { id: "antennapod", name: "AntennaPod", cat: "mobile", desc: "开源播客客户端，订阅管理清爽无广告。", url: "https://antennapod.org/", pricing: "开源", platforms: ["Android"], tags: ["播客", "无广告"] },
  { id: "opencamera", name: "Open Camera", cat: "mobile", desc: "开源相机，手动参数与稳定拍摄，无隐私收集。", url: "https://opencamera.org.uk/", pricing: "开源", platforms: ["Android"], tags: ["相机", "开源"] },
  { id: "trailsense", name: "Trail Sense", cat: "mobile", desc: "离线户外工具，指南针/气压/高度，无网络也能用。", url: "https://github.com/kylecorry31/Trail-Sense", pricing: "开源", platforms: ["Android"], tags: ["户外", "离线"] },
];
