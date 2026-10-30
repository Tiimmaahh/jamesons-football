#!/usr/bin/env python3
"""Build Jameson's Football without requiring npm or TypeScript.

The source files execute together inside the original private IIFE. This preserves
all shared closures and gameplay behavior while allowing targeted source edits.
"""
from pathlib import Path
import shutil
import hashlib

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PUBLIC = ROOT / "public"
DIST = ROOT / "dist"
PARTS = [
    "state.js", "celebrations.js", "scoring.js", "kickoffs.js",
    "formations.js", "routes.js", "drives.js", "returns.js", "simulation.js",
    "render.js", "main.js",
]

if DIST.exists():
    shutil.rmtree(DIST)
shutil.copytree(PUBLIC, DIST)
shutil.copy2(SRC / "styles.css", DIST / "styles.css")
(DIST / "game.js").write_text("\n".join((SRC / part).read_text(encoding="utf-8") for part in PARTS), encoding="utf-8")
# Each release gets a separate, complete offline cache.
version = hashlib.sha256()
for asset in sorted(DIST.rglob("*")):
    if asset.is_file():
        version.update(asset.relative_to(DIST).as_posix().encode("utf-8"))
        version.update(asset.read_bytes())
worker = DIST / "service-worker.js"
worker.write_text(worker.read_text(encoding="utf-8").replace("__BUILD_VERSION__", version.hexdigest()[:16]), encoding="utf-8")
print(f"Built {DIST} with {len(PARTS)} source modules")
