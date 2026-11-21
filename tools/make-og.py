# 링크 미리보기 카드(og.png, 1200x630)를 만든다.  python tools/make-og.py
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
img = Image.new('RGB', (W, H))
d = ImageDraw.Draw(img)
# 배경: 위→아래 파란 그라데이션
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=(int(30 + 40 * t), int(64 + 10 * t), int(175 + 30 * t)))
F = 'C:/Windows/Fonts/'
bold = lambda s: ImageFont.truetype(F + 'malgunbd.ttf', s)
reg = lambda s: ImageFont.truetype(F + 'malgun.ttf', s)

# 오른쪽: 점점 높아지는 빌딩 + 성장 그래프
base = 560
blds = [(640, 100, 150), (760, 90, 230), (870, 105, 300), (995, 110, 400)]
for i, (x, w, h) in enumerate(blds):
    shade = 235 - i * 8
    d.rounded_rectangle([x, base - h, x + w, base], 6, fill=(shade, shade + 5, 255))
    for wy in range(base - h + 22, base - 20, 34):
        for wx in range(x + 16, x + w - 22, 30):
            lit = (wx * 7 + wy * 3) % 5 != 0
            d.rectangle([wx, wy, wx + 14, wy + 18], fill=(253, 224, 120) if lit else (150, 170, 230))
d.rectangle([600, base, 1160, base + 8], fill=(255, 255, 255))
pts = [(655, 470), (720, 430), (780, 450), (870, 330), (960, 300), (1080, 150)]
d.line(pts, fill=(74, 222, 128), width=10, joint='curve')
d.polygon([(1080, 128), (1100, 160), (1062, 158)], fill=(74, 222, 128))
d.ellipse([1080, 40, 1140, 100], fill=(251, 191, 36))

# 왼쪽: 글자
d.text((70, 70), '세계 기업 성장 시뮬레이션', font=bold(30), fill=(191, 219, 254))
d.text((62, 112), '재벌까지', font=bold(140), fill=(255, 255, 255))
d.text((70, 300), '동네 스타트업에서', font=reg(40), fill=(230, 238, 255))
d.text((70, 350), '100조 원 그룹까지', font=bold(40), fill=(255, 255, 255))
chips = ['6개국', '7개 업종', '106가지 돌발 이벤트']
x = 70
for c in chips:
    tw = d.textlength(c, font=bold(26))
    d.rounded_rectangle([x, 430, x + tw + 36, 478], 24, fill=(255, 255, 255))
    d.text((x + 18, 435), c, font=bold(26), fill=(37, 99, 235))
    x += tw + 50
d.text((70, 515), '무료 · 설치 없이 바로 플레이', font=reg(28), fill=(191, 219, 254))
img.save('og.png', optimize=True)
print('og.png', img.size)
