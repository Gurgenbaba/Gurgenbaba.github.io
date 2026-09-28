from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path("assets/img/brand/abbes-og-1200x630.jpg")
OUT.parent.mkdir(parents=True, exist_ok=True)

img = Image.new("RGB", (W, H), (244, 247, 251))
draw = ImageDraw.Draw(img)

# Quiet light gradient
for y in range(H):
    t = y / (H - 1)
    r = int(244 * (1 - t) + 235 * t)
    g = int(247 * (1 - t) + 242 * t)
    b = int(251 * (1 - t) + 250 * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Soft ABBES blue glow
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for radius, alpha in [(360, 15), (280, 22), (210, 28), (140, 36)]:
    gd.ellipse((950-radius, 90-radius, 950+radius, 90+radius), fill=(37, 99, 235, alpha))
img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
draw = ImageDraw.Draw(img)

NAVY = (11, 24, 48)
BLUE = (37, 99, 235)
MUTED = (95, 111, 134)
WHITE = (255, 255, 255)

def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# Mark
draw.rounded_rectangle((70, 72, 174, 176), radius=24, fill=NAVY)
draw.polygon([(95,148),(116,99),(130,99),(151,148),(137,148),(132,135),(114,135),(109,148)], fill=WHITE)
draw.ellipse((150,147,162,159), fill=BLUE)

# Brand
draw.text((198, 82), "ABBES.", font=font(48, True), fill=NAVY)
draw.text((200, 142), "DIGITAL", font=font(18, True), fill=MUTED)

# Divider
draw.rounded_rectangle((70, 216, 1130, 218), radius=1, fill=(211, 220, 232))

# Main copy
draw.text((70, 272), "Abbes Gudes fürs Netz.", font=font(58, True), fill=NAVY)
draw.text((70, 354), "Websites · Shops · Web-Apps · digitale Systeme", font=font(25), fill=MUTED)
draw.text((70, 398), "Persönlich entwickelt aus Breitungen/Werra.", font=font(25), fill=MUTED)

# Bottom proof pill
draw.rounded_rectangle((70, 492, 470, 548), radius=18, fill=(232, 239, 252))
draw.text((93, 509), "DIGITAL · DIREKT · MITWACHSEND", font=font(18, True), fill=BLUE)

# Quiet system motif
for i in range(5):
    x = 885 + i * 48
    draw.rounded_rectangle((x, 454, x + 30, 484), radius=8, outline=(199, 210, 225), width=2)
draw.line((900, 499, 1100, 499), fill=(199, 210, 225), width=2)
draw.ellipse((1091, 490, 1109, 508), fill=BLUE)

img.save(OUT, "JPEG", quality=90, optimize=True, progressive=True)
print(f"generated {OUT} ({OUT.stat().st_size} bytes)")
