# 게임 사이트용 표지(release/cover.png 630x500, release/cover-wide.png 1280x720)를 만든다.  python tools/make-cover.py
import os
from PIL import Image, ImageDraw, ImageFont
F = 'C:/Windows/Fonts/'
bold = lambda s: ImageFont.truetype(F + 'segoeuib.ttf', s)
reg = lambda s: ImageFont.truetype(F + 'segoeui.ttf', s)
os.makedirs('release', exist_ok=True)


def scene(d, W, H, base, scale, x0):
    blds = [(0, 100, 150), (120, 90, 230), (230, 105, 300), (355, 110, 400)]
    for i, (x, w, h) in enumerate(blds):
        x, w, h = x0 + x * scale, w * scale, h * scale
        shade = 235 - i * 8
        d.rounded_rectangle([x, base - h, x + w, base], 6, fill=(shade, shade + 5, 255))
        wy = base - h + 22 * scale
        while wy < base - 20 * scale:
            wx = x + 16 * scale
            while wx < x + w - 22 * scale:
                lit = (int(wx) * 7 + int(wy) * 3) % 5 != 0
                d.rectangle([wx, wy, wx + 14 * scale, wy + 18 * scale], fill=(253, 224, 120) if lit else (150, 170, 230))
                wx += 30 * scale
            wy += 34 * scale
    d.rectangle([x0 - 40 * scale, base, x0 + 520 * scale, base + 8 * scale], fill=(255, 255, 255))
    pts = [(15, -90), (80, -130), (140, -110), (230, -230), (320, -260), (440, -410)]
    d.line([(x0 + px * scale, base + py * scale) for px, py in pts], fill=(74, 222, 128), width=int(10 * scale), joint='curve')
    tx, ty = x0 + 440 * scale, base - 410 * scale
    d.polygon([(tx, ty - 22 * scale), (tx + 20 * scale, ty + 10 * scale), (tx - 18 * scale, ty + 8 * scale)], fill=(74, 222, 128))
    d.ellipse([x0 + 450 * scale, base - 520 * scale, x0 + 510 * scale, base - 460 * scale], fill=(251, 191, 36))


def bg(W, H):
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(30 + 40 * t), int(64 + 10 * t), int(175 + 30 * t)))
    return img, d


def chips(d, x, y, items, size):
    for c in items:
        tw = d.textlength(c, font=bold(size))
        d.rounded_rectangle([x, y, x + tw + size * 1.4, y + size * 1.85], size, fill=(255, 255, 255))
        d.text((x + size * 0.7, y + size * 0.2), c, font=bold(size), fill=(37, 99, 235))
        x += tw + size * 1.9


# 630x500 (itch.io 표지)
img, d = bg(630, 500)
scene(d, 630, 500, 470, 0.62, 300)
d.text((36, 36), 'GLOBAL BUSINESS SIM', font=bold(20), fill=(191, 219, 254))
d.text((32, 62), 'Road to', font=bold(58), fill=(255, 255, 255))
d.text((32, 124), 'Chaebol', font=bold(72), fill=(255, 255, 255))
d.text((36, 222), 'Startup → ₩100 trillion', font=reg(24), fill=(230, 238, 255))
d.text((36, 254), 'empire', font=reg(24), fill=(230, 238, 255))
chips(d, 36, 312, ['6 countries', '8 languages'], 17)
chips(d, 36, 360, ['106 events'], 17)
d.text((36, 440), 'Free · plays in browser', font=reg(19), fill=(191, 219, 254))
img.save('release/cover.png', optimize=True)

# 1280x720 (모음 사이트 썸네일·배너)
img, d = bg(1280, 720)
scene(d, 1280, 720, 640, 1.05, 660)
d.text((80, 90), 'GLOBAL BUSINESS SIM', font=bold(34), fill=(191, 219, 254))
d.text((72, 132), 'Road to Chaebol', font=bold(104), fill=(255, 255, 255))
d.text((80, 290), 'Grow a random startup into a', font=reg(40), fill=(230, 238, 255))
d.text((80, 342), '₩100 trillion empire', font=bold(40), fill=(255, 255, 255))
chips(d, 80, 430, ['6 countries', '7 industries', '106 events'], 28)
d.text((80, 560), 'Free · 8 languages · no install', font=reg(30), fill=(191, 219, 254))
img.save('release/cover-wide.png', optimize=True)
print('release/cover.png, release/cover-wide.png')
