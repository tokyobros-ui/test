#!/usr/bin/env python3
"""photos/ 配下のイベントフォルダを走査して photos/manifest.json を生成する。

使い方:
    python3 scripts/build_manifest.py

フォルダ構成:
    photos/
      2026-04-01_お花見/
        001.jpg
        002.jpg
      2026-08-15_夏祭り/
        ...

- フォルダ名がそのままイベント名になる（先頭の日付 "YYYY-MM-DD_" は表示時に分離）。
- 画像はファイル名の自然順（1, 2, 10 の順）で並ぶ。
- フォルダ内に cover.* があればそれを表紙にする。なければ先頭の画像。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "photos"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"}
DATE_PREFIX = re.compile(r"^(\d{4}-\d{2}-\d{2})[_\s-]+(.+)$")


def natural_key(name: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def main() -> None:
    events = []
    for folder in sorted((p for p in PHOTOS.iterdir() if p.is_dir() and not p.name.startswith(".")),
                         key=lambda p: natural_key(p.name), reverse=True):
        images = sorted(
            (f.name for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS),
            key=natural_key,
        )
        if not images:
            continue
        cover = next((i for i in images if Path(i).stem.lower() == "cover"), images[0])
        m = DATE_PREFIX.match(folder.name)
        events.append({
            "folder": folder.name,
            "title": m.group(2) if m else folder.name,
            "date": m.group(1) if m else None,
            "cover": cover,
            "images": images,
        })

    out = PHOTOS / "manifest.json"
    out.write_text(json.dumps({"events": events}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(e["images"]) for e in events)
    print(f"{out.relative_to(ROOT)}: {len(events)} イベント / {total} 枚")


if __name__ == "__main__":
    main()
