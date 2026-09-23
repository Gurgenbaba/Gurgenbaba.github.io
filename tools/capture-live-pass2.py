"""Second-pass live captures plus a debug-free Budenboss crop of real pixels."""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / "artifacts" / "captures"
RSG = ROOT / "assets" / "img" / "projects" / "random-space-game"
BB = ROOT / "assets" / "img" / "projects" / "budenboss"
SRC_BB = Path(r"C:\Users\gurge\Documents\GitHub\BUDENBOSS\.budenboss-local-ci\artifacts\street-review\stand-t0.png")


def to_webp(src: Path | Image.Image, dest: Path, max_w: int, quality: int = 84) -> None:
    im = src if isinstance(src, Image.Image) else Image.open(src)
    im = im.convert("RGB")
    if im.width > max_w:
        h = round(im.height * (max_w / im.width))
        im = im.resize((max_w, h), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"saved {dest.name} {dest.stat().st_size} {Image.open(dest).size}")


def recapture() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1, locale="de-DE")
        page.goto("https://web-production-165f5.up.railway.app/", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(1600)
        for label in ("Ablehnen", "Akzeptieren", "Details"):
            loc = page.get_by_role("button", name=label)
            if label != "Details" and loc.count():
                loc.first.click()
                page.wait_for_timeout(600)
                break
        raw_rsg = TMP / "rsg-landing.png"
        page.screenshot(path=str(raw_rsg), full_page=False, animations="disabled")
        to_webp(raw_rsg, RSG / "preview.webp", max_w=1400, quality=84)
        browser.close()


def budenboss_clean_crop() -> None:
    """Single continuous crop below the debug overlay. Real product UI only."""
    im = Image.open(SRC_BB).convert("RGB")
    w, h = im.size
    crop = im.crop((0, 448, w, h))
    TMP.mkdir(parents=True, exist_ok=True)
    crop.save(TMP / "budenboss-clean.png")
    to_webp(crop, BB / "stand.webp", max_w=780, quality=88)


if __name__ == "__main__":
    budenboss_clean_crop()
    recapture()
