# FreeNav 新标签页扩展

把浏览器「新标签页」变成 FreeNav 精选免费 / 开源软件入口：打开新标签即见 98 款工具，按场景筛选，搜索直达 freenav.net。

- 纯前端、无后端、无追踪（不申请任何敏感权限）
- 数据内嵌（离线可用），搜索框回车会打开 `https://freenav.net/?q=...`

## 安装（开发者模式 / 加载已解压）

### Chrome / Edge / Brave（Chromium 内核）
1. 打开 `chrome://extensions`（Edge 为 `edge://extensions`）。
2. 右上角打开「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本 `extension/` 文件夹。
4. 打开新标签页即可看到 FreeNav。

### Firefox
1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击「临时载入附加组件」，选择本目录下的 `manifest.json`。
3. 打开新标签页即可看到 FreeNav（临时载入，重启浏览器后失效；正式发布需签名打包）。

## 文件
- `manifest.json` — MV3 清单（newtab 覆盖）
- `newtab.html / newtab.css / newtab.js` — 新标签页界面与逻辑
- `data.js` — 由站点 `assets/js/data.js` 生成的精简数据集（98 工具 + 10 分类）
- `icons/` — 扩展图标

## 更新数据
站点数据变动后，重新生成 `data.js`：
```bash
node -e "global.window={}; require('./assets/js/data.js'); var cats=window.FREENAV_CATEGORIES.map(c=>({key:c.key,label:c.label,icon:c.icon,color:c.color,color2:c.color2})); var tools=window.FREENAV_SOFTWARE.map(t=>({id:t.id,name:t.name,cat:t.cat,desc:t.desc,url:t.url,pricing:t.pricing,platforms:t.platforms,tags:t.tags})); var fs=require('fs'); fs.writeFileSync('./extension/data.js','window.FREENAV_EXT_CATS='+JSON.stringify(cats)+';\nwindow.FREENAV_EXT='+JSON.stringify(tools)+';');"
```
然后回到扩展管理页点击「重新加载」。
