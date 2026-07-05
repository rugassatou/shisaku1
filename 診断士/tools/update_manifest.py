#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MATERIALS = ROOT / "materials"
MANIFEST = MATERIALS / "manifest.json"


def main():
    bundle = MATERIALS / "materials_bundle.json"
    if bundle.exists():
        MANIFEST.write_text(
            json.dumps(
                {
                    "materials": [
                        {
                            "path": bundle.name,
                            "type": "bundle",
                            "title": "事例I〜III 30本セット",
                        }
                    ]
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print(f"updated {MANIFEST} (bundle)")
        return
    items = []
    for path in sorted(MATERIALS.glob("*.json")):
        if path.name == "manifest.json":
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        items.append(
            {
                "path": path.name,
                "year": data.get("year", ""),
                "caseName": data.get("caseName", ""),
                "title": data.get("title", path.stem),
            }
        )
    MANIFEST.write_text(
        json.dumps({"materials": items}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"updated {MANIFEST} ({len(items)} materials)")


if __name__ == "__main__":
    main()
