"""Viewport screenshots for visual QA. Not committed."""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "qa"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/"


def main() -> None:
    views = [(390, 844, "mobile-390"), (1366, 768, "desktop-1366"), (1920, 1080, "desktop-1920")]
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w, h, name in views:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(300)
            page.evaluate("() => window.scrollTo(0, 0)")
            page.wait_for_timeout(200)
            overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            errors = page.evaluate("() => window.__errors || []")
            page.screenshot(path=str(OUT / f"{name}-top.png"), full_page=False, animations="disabled")
            page.screenshot(path=str(OUT / f"{name}-full.png"), full_page=True, animations="disabled")
            print(name, "overflow_x", overflow)
            page.close()

        page = browser.new_page()
        logs = []
        page.on("pageerror", lambda err: logs.append(str(err)))
        page.on("console", lambda msg: logs.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
        failed = []
        page.on("response", lambda res: failed.append(res.url) if res.status >= 400 else None)
        page.goto(URL, wait_until="networkidle")
        hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        print("console/page errors", logs)
        print("failed responses", failed)
        print("links", hrefs)
        browser.close()


if __name__ == "__main__":
    main()
