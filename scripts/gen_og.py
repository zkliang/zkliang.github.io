# 生成社交分享图 og.png（1200x630）
# 用法：python scripts/gen_og.py
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "og.png")

FONT_PATHS = [
    "C:/Windows/Fonts/msyh.ttc",      # 微软雅黑
    "C:/Windows/Fonts/simhei.ttf",    # 黑体
    "C:/Windows/Fonts/simsun.ttc",     # 宋体
]
FONT = None
for fp in FONT_PATHS:
    if os.path.exists(fp):
        try:
            FONT = ImageFont.truetype(fp, 1, index=0)
        except Exception:
            try: FONT = ImageFont.truetype(fp, 1)
            except Exception: FONT = None
        if FONT: break

def font(sz):
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, sz, index=0)
            except Exception:
                try: return ImageFont.truetype(fp, sz)
                except Exception: continue
    return ImageFont.load_default()

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#0b1220")
d = ImageDraw.Draw(img)

# 背景竖向渐变
top, bot = (11, 18, 32), (23, 33, 58)
for y in range(H):
    t = y / H
    r = int(top[0] + (bot[0] - top[0]) * t)
    g = int(top[1] + (bot[1] - top[1]) * t)
    b = int(top[2] + (bot[2] - top[2]) * t)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# 右上角品牌光晕
d.ellipse([W - 360, -200, W + 120, 320], fill=(56, 189, 248, 60) if False else (34, 211, 238, 40))

# 内容边距
M = 80

# ◆ 标记 + FreeNav 大标题
accent = "#38bdf8"
d.text((M, 120), "◆", font=font(44), fill=accent)
brand = "FreeNav"
bb = d.textbbox((0, 0), brand, font=font(96))
d.text((M + 60, 110), brand, font=font(96), fill="#ffffff")
bw = bb[2] - bb[0] + 60
# 副标题
d.text((M + 4, 232), "免费软件导航", font=font(36), fill="#cbd5e1")

# 标语（中文）
d.text((M + 4, 300), "精选 100+ 款真正免费、开源的软件", font=font(34), fill="#e2e8f0")
d.text((M + 4, 348), "附 4 个差异化专题对比表与深度测评", font=font(34), fill="#e2e8f0")

# 底部 4 个专题胶囊
pills = [
    ("开源替代", "#2dd4bf"),
    ("新人装机", "#34d399"),
    ("设计师素材", "#f472b6"),
    ("本地 AI", "#a78bfa"),
]
px, py, ph = M + 4, 470, 56
for label, col in pills:
    f = font(28)
    tw = d.textlength(label, font=f)
    pw = tw + 56
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=ph // 2, fill=(255, 255, 255, 22))
    d.ellipse([px + 22, py + ph // 2 - 7, px + 36, py + ph // 2 + 7], fill=col)
    d.text((px + 46, py + ph // 2 - 18), label, font=f, fill="#e2e8f0")
    px += pw + 20

img.save(OUT, "PNG")
print("og.png 已生成：", OUT, img.size)
