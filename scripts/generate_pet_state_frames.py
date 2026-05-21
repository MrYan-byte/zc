from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Callable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters" / "sea-lady"
OUTPUT_DIR = ASSET_DIR / "animated"
PREVIEW_DIR = ROOT / "tmp" / "sea-lady-action-assets"

STATES = [
    "idle",
    "listen",
    "talk",
    "think",
    "happy",
    "angry",
    "sleep",
    "surprised",
    "loading",
    "wave",
]

FRAME_COUNT = 8
FRAME_SIZE = (795, 1628)
TARGET_VISIBLE_HEIGHT = 1547
BOTTOM_MARGIN = 24


def _sin01(value: float) -> float:
    return math.sin(value * math.tau)


def _pulse(value: float) -> float:
    return (1 - math.cos(value * math.tau)) / 2


def _bounce(value: float) -> float:
    return math.sin(value * math.pi)


def idle_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 1.4 * _sin01(t),
        "y": -6.0 * _pulse(t),
        "scale": 1.0 + 0.008 * _pulse(t),
    }


def listen_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": -1.8 + 1.8 * _sin01(t),
        "y": -4.0 * _pulse(t),
        "scale": 1.0 + 0.006 * _bounce(t),
    }


def talk_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    cadence = _pulse((frame % 4) / 4)
    return {
        "x": 0.0,
        "y": -2.0 * cadence,
        "scale": 1.0 + 0.003 * cadence,
    }


def think_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 1.0 * _sin01(t),
        "y": -4.0 * _pulse(t),
        "scale": 1.0 + 0.005 * _pulse(t),
    }


def happy_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 0.0,
        "y": -5.0 * _pulse(t),
        "scale": 1.0 + 0.007 * _pulse(t),
    }


def angry_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 0.0,
        "y": -2.0 * _pulse(t),
        "scale": 1.0,
    }


def sleep_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 0.5 * _sin01(t),
        "y": -3.0 * _pulse(t),
        "scale": 1.0 + 0.004 * _pulse(t),
    }


def surprised_motion(frame: int) -> dict[str, float]:
    pattern = [0.0, -10.0, -18.0, -11.0, -6.0, -3.0, -1.0, 0.0]
    scale = [1.0, 1.01, 1.018, 1.012, 1.006, 1.002, 1.0, 1.0][frame]
    return {
        "x": 0.0,
        "y": pattern[frame],
        "scale": scale,
    }


def loading_motion(frame: int) -> dict[str, float]:
    t = frame / FRAME_COUNT
    return {
        "x": 0.0,
        "y": -4.0 * _pulse(t),
        "scale": 1.0 + 0.006 * _pulse(t),
    }


def wave_motion(frame: int) -> dict[str, float]:
    pattern = [0.0, -5.0, -11.0, -15.0, -11.0, -7.0, -3.0, 0.0]
    return {
        "x": 1.5 * _sin01(frame / FRAME_COUNT),
        "y": pattern[frame],
        "scale": 1.0 + 0.01 * _bounce(frame / (FRAME_COUNT - 1)),
    }


STATE_MOTIONS: dict[str, Callable[[int], dict[str, float]]] = {
    "idle": idle_motion,
    "listen": listen_motion,
    "talk": talk_motion,
    "think": think_motion,
    "happy": happy_motion,
    "angry": angry_motion,
    "sleep": sleep_motion,
    "surprised": surprised_motion,
    "loading": loading_motion,
    "wave": wave_motion,
}


def build_normalized_base(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getbbox()
    if bbox is None:
        raise RuntimeError("Image has no visible pixels.")

    crop = image.crop(bbox)
    scale = TARGET_VISIBLE_HEIGHT / crop.height
    resized = crop.resize(
        (round(crop.width * scale), round(crop.height * scale)),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    x = (FRAME_SIZE[0] - resized.width) // 2
    y = FRAME_SIZE[1] - resized.height - BOTTOM_MARGIN
    canvas.alpha_composite(resized, (x, y))
    return canvas


def build_frame(base: Image.Image, state: str, frame_index: int) -> Image.Image:
    motion = STATE_MOTIONS[state](frame_index)
    bbox = base.getbbox()
    if bbox is None:
        raise RuntimeError(f"Base frame for {state} is empty.")

    crop = base.crop(bbox)
    scaled = crop.resize(
        (
            max(1, round(crop.width * motion["scale"])),
            max(1, round(crop.height * motion["scale"])),
        ),
        Image.Resampling.LANCZOS,
    )

    frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    x = round((FRAME_SIZE[0] - scaled.width) / 2 + motion["x"])
    y = FRAME_SIZE[1] - scaled.height - BOTTOM_MARGIN + round(motion["y"])
    frame.alpha_composite(scaled, (x, y))
    return frame


def build_sheet(state: str) -> None:
    source_path = ASSET_DIR / f"{state}-tight.webp"
    normalized = build_normalized_base(Image.open(source_path))

    frames = [build_frame(normalized, state, frame_index) for frame_index in range(FRAME_COUNT)]
    sheet = Image.new("RGBA", (FRAME_SIZE[0] * FRAME_COUNT, FRAME_SIZE[1]), (0, 0, 0, 0))
    for frame_index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (FRAME_SIZE[0] * frame_index, 0))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT_DIR / f"{state}-sheet.webp", "WEBP", quality=86, method=6, exact=True)


def main() -> None:
    states = sys.argv[1:] or STATES
    unknown_states = sorted(set(states) - set(STATES))
    if unknown_states:
        raise RuntimeError(f"Unknown states: {', '.join(unknown_states)}")

    for state in states:
        build_sheet(state)
        print(f"generated {state}-sheet.webp")


if __name__ == "__main__":
    main()
