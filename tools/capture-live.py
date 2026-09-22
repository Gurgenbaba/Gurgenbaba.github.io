"""Capture live public project UIs. Fail closed: no fake images."""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT_MS = ROOT / "assets" / "img" / "projects" / "myschamhaar"
OUT_RSG = ROOT / "assets" / "img" / "projects" / "random-space-game"
TMP = ROOT / "artifacts" / "captures"
TMP.mkdir(parents=True, exist_ok=True)


def to_webp(src: Path, dest: Path, max_w: int, quality: int = 80) -> None:
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > max_w:
            h = round(im.height * (max_w / im.width))
            im = im.resize((max_w, h), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "WEBP", quality=quality, method=6)
    print(f"saved {dest} {dest.stat().st_size} {Image.open(dest).size}")


def shot(page, path: Path) -> None:
    page.screenshot(path=str(path), full_page=False, animations="disabled")


def capture_myschamhaar(page) -> bool:
    url = "https://myschamhaar-revival-production.up.railway.app/"
    try:
        page.set_viewport_size({"width": 1280, "height": 800})
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(2500)
        raw = TMP / "myschamhaar-landing.png"
        shot(page, raw)
        # Prefer a named play surface if present; otherwise keep landing if it looks like the product.
        title = page.title()
        print("myschamhaar title:", title, "url:", page.url)
        if raw.stat().st_size < 4000:
            print("myschamhaar capture too small, skip")
            return False
        to_webp(raw, OUT_MS / "live.webp", max_w=1400)
        return True
    except Exception as exc:
        print("myschamhaar capture failed:", exc)
        return False


def capture_rsg(page) -> bool:
    url = "https://web-production-165f5.up.railway.app/"
    try:
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(2500)
        raw = TMP / "rsg-landing.png"
        shot(page, raw)
        print("rsg title:", page.title(), "url:", page.url)
        if raw.stat().st_size < 4000:
            print("rsg capture too small, skip")
            return False
        to_webp(raw, OUT_RSG / "preview.webp", max_w=1400)
        return True
    except Exception as exc:
        print("rsg capture failed:", exc)
        return False


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(device_scale_factor=1, locale="de-DE")
        page = context.new_page()
        ms = capture_myschamhaar(page)
        rsg = capture_rsg(page)
        browser.close()
        print("RESULT myschamhaar", ms, "rsg", rsg)


if __name__ == "__main__":
    main()
