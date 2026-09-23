"""Visual and technical QA for every page at phone, laptop and desktop widths.

Serve the repo first, then run:

    python -m http.server 8791
    python tools/qa-viewports.py            # or: QA_BASE=http://127.0.0.1:8791 python tools/qa-viewports.py

For each page and width it saves a full-page screenshot to artifacts/qa/ (git-ignored)
and fails when a page scrolls sideways, an image is broken, a script throws, or a
same-origin request fails. Requests to genesis-colonies.com are expected to be
blocked by CORS on localhost and are ignored.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "qa"
BASE = os.environ.get("QA_BASE", "http://127.0.0.1:8791").rstrip("/")
PAGES = [
    "/",
    "/en/",
    "/case-study/genesis-colonies/",
    "/en/case-study/genesis-colonies/",
    "/404.html",
    "/impressum.html",
    "/datenschutz.html",
    "/demo/salon/",
]
WIDTHS = [(1920, 1080), (1366, 768), (375, 812), (320, 700)]


def slug(path: str) -> str:
    return path.strip("/").replace("/", "_").replace(".html", "") or "home"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    problems: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for width, height in WIDTHS:
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
            # Skip the first-visit language dialog so screenshots show the page itself.
            context.add_init_script("try { localStorage.setItem('gb-lang', 'de'); } catch (e) {}")
            for path in PAGES:
                page = context.new_page()
                errors: list[str] = []
                page.on("pageerror", lambda err: errors.append(f"script error: {err}"))
                page.on("response", lambda res: errors.append(f"HTTP {res.status} {res.url}")
                        if res.status >= 400 and res.url.startswith(BASE) and not res.url.endswith("/favicon.ico") else None)
                page.goto(BASE + path, wait_until="networkidle", timeout=30000)
                page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('on'))")
                page.wait_for_timeout(300)
                overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
                broken = page.evaluate(
                    "() => [...document.images].filter(i => i.complete && i.getAttribute('src') && i.naturalWidth === 0).map(i => i.src)")
                if overflow > 0:
                    errors.append(f"scrolls sideways by {overflow}px")
                errors += [f"broken image {src}" for src in broken]
                page.screenshot(path=str(OUT / f"{slug(path)}-{width}.png"), full_page=True, animations="disabled")
                status = "ok" if not errors else "FAIL"
                print(f"{status:4} {width:>4}px {path}")
                problems += [f"{width}px {path}: {e}" for e in errors]
                page.close()
            context.close()
        browser.close()
    if problems:
        print("\n".join(["", "Problems:"] + problems))
        return 1
    print(f"\nAll {len(PAGES) * len(WIDTHS)} checks passed. Screenshots in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
