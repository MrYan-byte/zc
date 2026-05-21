from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters" / "sea-lady"
STATE_FILES = sorted(ASSET_DIR.glob("*-tight.webp"))
INTERIOR_ALPHA_THRESHOLD = 72
EDGE_ALPHA_MULTIPLIER = 1.6


def solidify_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = list(rgba.getdata())
    normalized: list[tuple[int, int, int, int]] = []

    for r, g, b, a in pixels:
        if a == 0:
            normalized.append((r, g, b, 0))
        elif a >= INTERIOR_ALPHA_THRESHOLD:
            normalized.append((r, g, b, 255))
        else:
            strengthened = min(255, round(a * EDGE_ALPHA_MULTIPLIER))
            normalized.append((r, g, b, strengthened))

    result = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    result.putdata(normalized)
    return result


def main() -> None:
    for source_path in STATE_FILES:
        image = Image.open(source_path)
        solidified = solidify_alpha(image)
        solidified.save(source_path, "WEBP", quality=92, method=6, exact=True)
        print(f"solidified {source_path.name}")


if __name__ == "__main__":
    main()
