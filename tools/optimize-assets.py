"""Create optimized portfolio copies. Never writes back into source projects."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "assets" / "img"

GC = Path(r"C:\Users\gurge\Desktop\RandomStuff\Coding\Genesis Colonies\static\img\landing")
OD = Path(r"C:\Users\gurge\Documents\GitHub\genesis-colonies-overdrive\release\itch")


def save_webp(src: Path, dest: Path, max_w: int, quality: int = 78) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > max_w:
            h = round(im.height * (max_w / im.width))
            im = im.resize((max_w, h), Image.Resampling.LANCZOS)
        im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.relative_to(ROOT)}  {dest.stat().st_size}  {Image.open(dest).size}")


def copy_bytes(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(src.read_bytes())
    print(f"{dest.relative_to(ROOT)}  {dest.stat().st_size}  copy")


def main() -> None:
    gc_shots = {
        "hero-poster.webp": GC / "hero-poster.webp",
        "overview.webp": GC / "shots" / "shot-01-overview.webp",
        "galaxy.webp": GC / "shots" / "shot-02-galaxy.webp",
        "world-boss.webp": GC / "shots" / "shot-03-world-boss.webp",
        "fleet.webp": GC / "shots" / "shot-04-fleet.webp",
        "empire.webp": GC / "shots" / "shot-06-empire.webp",
        "research.webp": GC / "shots" / "shot-11-research.webp",
        "commander.webp": GC / "shots" / "shot-12-commander.webp",
    }
    for name, src in gc_shots.items():
        dest = IMG / "projects" / "genesis-colonies" / name
        # Already compressed WebP around 100-180KB; recode to a card-safe width.
        max_w = 1600 if name == "overview.webp" else 1400
        save_webp(src, dest, max_w=max_w, quality=80)

    od = {
        "cover.webp": (OD / "cover-630x500.png", 630, 82),
        "combat.webp": (OD / "screenshots" / "combat.png", 1600, 76),
        "boss.webp": (OD / "screenshots" / "boss.png", 1400, 76),
        "ark-command.webp": (OD / "screenshots" / "ark-command.png", 1400, 76),
        "multiplayer.webp": (OD / "screenshots" / "multiplayer.png", 1400, 76),
    }
    for name, (src, max_w, q) in od.items():
        save_webp(src, IMG / "projects" / "overdrive" / name, max_w=max_w, quality=q)


if __name__ == "__main__":
    main()
