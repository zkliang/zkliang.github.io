#!/usr/bin/env node
/**
 * FreeNav 构建脚本 —— 一键压缩 CSS/JS 并更新 HTML 引用
 * 用法：node scripts/build.mjs
 * 压缩后的文件保存在同目录下 *.min.css / *.min.js
 * HTML 会自动切换到 .min 版本（回滚：node scripts/build.mjs --dev）
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets/js');
const CSS_DIR = path.join(ROOT, 'assets/css');
const JS_FILES = ['app.js', 'data.js', 'columns.js', 'column-render.js', 'config.js', 'icons.js', 'theme.js', 'licenses.js', 'pwa-install.js', 'tools-detail.js'];
const CSS_FILES = ['style.css', 'tools.css'];
// 仅对真正会生成 .min 的文件做引用替换，避免把 sw-register.js 等未压缩脚本误改成不存在的 .min.js
const JS_BASE = new Set(JS_FILES.map(f => f.replace(/\.js$/, '')));

const isDev = process.argv.includes('--dev');

function minifyJS(files) {
  let totalOrig = 0, totalMin = 0;
  files.forEach(f => {
    const src = fs.readFileSync(path.join(JS_DIR, f), 'utf8');
    totalOrig += src.length;
    const result = UglifyJS.minify(src, { compress: true, mangle: false });
    if (result.error) throw new Error(`UglifyJS error in ${f}: ${JSON.stringify(result.error)}`);
    const outPath = path.join(JS_DIR, f.replace('.js', '.min.js'));
    fs.writeFileSync(outPath, result.code);
    totalMin += result.code.length;
  });
  console.log(`JS: ${totalOrig} -> ${totalMin} bytes (saved ${Math.round((1 - totalMin / totalOrig) * 100)}%)`);
}

function minifyCSS(files) {
  const cleaner = new CleanCSS();
  let totalOrig = 0, totalMin = 0;
  files.forEach(f => {
    const src = fs.readFileSync(path.join(CSS_DIR, f), 'utf8');
    totalOrig += src.length;
    const output = cleaner.minify(src);
    const outPath = path.join(CSS_DIR, f.replace('.css', '.min.css'));
    fs.writeFileSync(outPath, output.styles);
    totalMin += output.styles.length;
  });
  console.log(`CSS: ${totalOrig} -> ${totalMin} bytes (saved ${Math.round((1 - totalMin / totalOrig) * 100)}%)`);
}

function updateHTMLRefs(useMin) {
  const htmlFiles = [
    path.join(ROOT, 'index.html'),
    ...fs.readdirSync(path.join(ROOT, 'columns')).filter(f => f.endsWith('.html')).map(f => path.join(ROOT, 'columns', f)),
  ];

  htmlFiles.forEach(fp => {
    let html = fs.readFileSync(fp, 'utf8');
    if (useMin) {
      // Switch to .min versions
      html = html.replace(/assets\/css\/style\.css/g, 'assets/css/style.min.css');
      html = html.replace(/assets\/js\/(\w[\w-]*)\.js/g, (m, name) => JS_BASE.has(name) ? `assets/js/${name}.min.js` : m);
      html = html.replace(/\.\.\/assets\/css\/style\.css/g, '../assets/css/style.min.css');
      html = html.replace(/\.\.\/assets\/js\/(\w[\w-]*)\.js/g, (m, name) => JS_BASE.has(name) ? `../assets/js/${name}.min.js` : m);
    } else {
      // Switch back to dev versions
      html = html.replace(/assets\/css\/style\.min\.css/g, 'assets/css/style.css');
      html = html.replace(/assets\/js\/(\w[\w-]*)\.min\.js/g, 'assets/js/$1.js');
      html = html.replace(/\.\.\/assets\/css\/style\.min\.css/g, '../assets/css/style.css');
      html = html.replace(/\.\.\/assets\/js\/(\w[\w-]*)\.min\.js/g, '../assets/js/$1.js');
    }
    fs.writeFileSync(fp, html);
  });
  console.log(`HTML refs updated to ${useMin ? '.min' : 'dev'} versions`);
}

if (isDev) {
  updateHTMLRefs(false);
  console.log('Dev mode: reverted HTML refs to unminified versions');
} else {
  minifyJS(JS_FILES);
  minifyCSS(CSS_FILES);
  updateHTMLRefs(true);
  console.log('Production build complete! Push to GitHub and the site will use minified assets.');
}
