"""Favicon, apple-touch, and Open Graph still. Uses already-copied Genesis overview."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "img" / "brand"
OG = ROOT / "assets" / "img" / "og"
OVERVIEW = ROOT / "assets" / "img" / "projects" / "genesis-colonies" / "overview.webp"
BRAND.mkdir(parents=True, exist_ok=True)
OG.mkdir(parents=True, exist_ok=True)


def favicon() -> None:
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#05070a"/>
  <rect x="1" y="1" width="30" height="30" fill="none" stroke="#c6f04a" stroke-width="1"/>
  <text x="16" y="23" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#c6f04a">G</text>
</svg>
"""
    (BRAND / "favicon.svg").write_text(svg, encoding="utf-8")
    img = Image.new("RGB", (32, 32), "#05070a")
    d = ImageDraw.Draw(img)
    d.rectangle((1, 1, 30, 30), outline="#c6f04a", width=1)
    try:
        font = ImageFont.truetype("arialbd.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    d.text((16, 15), "G", fill="#c6f04a", font=font, anchor="mm")
    img.save(BRAND / "favicon-32.png")

    touch = Image.new("RGB", (180, 180), "#05070a")
    d = ImageDraw.Draw(touch)
    d.rectangle((6, 6, 173, 173), outline="#c6f04a", width=3)
    try:
        font = ImageFont.truetype("arialbd.ttf", 92)
    except OSError:
        font = ImageFont.load_default()
    d.text((90, 86), "G", fill="#c6f04a", font=font, anchor="mm")
    touch.save(BRAND / "apple-touch.png")
    print("brand icons ok")


def og() -> None:
    base = Image.open(OVERVIEW).convert("RGB")
    canvas = Image.new("RGB", (1200, 630), "#05070a")
    # Cover-crop overview into the canvas
    scale = max(1200 / base.width, 630 / base.height)
    nw, nh = int(base.width * scale), int(base.height * scale)
    resized = base.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - 1200) // 2
    top = (nh - 630) // 2
    canvas.paste(resized.crop((left, top, left + 1200, top + 630)), (0, 0))
    overlay = Image.new("RGBA", (1200, 630), (5, 7, 10, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, 640):
        a = int(210 * (1 - x / 640))
        d.line([(x, 0), (x, 630)], fill=(5, 7, 10, a))
    canvas = canvas.convert("RGBA")
    canvas = Image.alpha_composite(canvas, overlay)
    draw = ImageDraw.Draw(canvas)
    try:
        small = ImageFont.truetype("arialbd.ttf", 18)
        big = ImageFont.truetype("arialbd.ttf", 64)
    except OSError:
        small = ImageFont.load_default()
        big = small
    draw.text((48, 210), "GURGENBABA", fill="#c6f04a", font=small)
    draw.text((48, 248), "WELTEN,", fill="#f4f7f8", font=big)
    draw.text((48, 318), "DIE BLEIBEN.", fill="#f4f7f8", font=big)
    draw.text((48, 420), "Games  ·  Systems  ·  Live projects", fill="#9aa8b0", font=small)
    out = canvas.convert("RGB")
    dest = OG / "share.webp"
    out.save(dest, "WEBP", quality=82, method=6)
    print("og", dest.stat().st_size, out.size)


if __name__ == "__main__":
    favicon()
    og()
