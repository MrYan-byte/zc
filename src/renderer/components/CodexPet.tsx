import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { PetState } from "../../shared/types";
import angrySheetUrl from "../../../assets/characters/sea-lady/animated/angry-sheet.webp?url";
import happySheetUrl from "../../../assets/characters/sea-lady/animated/happy-sheet.webp?url";
import idleSheetUrl from "../../../assets/characters/sea-lady/animated/idle-sheet.webp?url";
import listenSheetUrl from "../../../assets/characters/sea-lady/animated/listen-sheet.webp?url";
import loadingSheetUrl from "../../../assets/characters/sea-lady/animated/loading-sheet.webp?url";
import sleepSheetUrl from "../../../assets/characters/sea-lady/animated/sleep-sheet.webp?url";
import surprisedSheetUrl from "../../../assets/characters/sea-lady/animated/surprised-sheet.webp?url";
import talkSheetUrl from "../../../assets/characters/sea-lady/animated/talk-sheet.webp?url";
import thinkSheetUrl from "../../../assets/characters/sea-lady/animated/think-sheet.webp?url";
import waveSheetUrl from "../../../assets/characters/sea-lady/animated/wave-sheet.webp?url";

interface CodexPetProps {
  state: PetState;
  paused: boolean;
  lookOffset?: { x: number; y: number };
  microAction?: string;
}

type FrameConfig = {
  durationMs: number;
  loops: "infinite" | 1;
  sheet: string;
};

const STATE_FRAMES: Record<PetState, FrameConfig> = {
  idle: { sheet: idleSheetUrl, durationMs: 1200, loops: "infinite" },
  talk: { sheet: talkSheetUrl, durationMs: 1300, loops: "infinite" },
  think: { sheet: thinkSheetUrl, durationMs: 1400, loops: "infinite" },
  listen: { sheet: listenSheetUrl, durationMs: 1200, loops: "infinite" },
  happy: { sheet: happySheetUrl, durationMs: 1200, loops: "infinite" },
  angry: { sheet: angrySheetUrl, durationMs: 900, loops: "infinite" },
  sleep: { sheet: sleepSheetUrl, durationMs: 1800, loops: "infinite" },
  surprised: { sheet: surprisedSheetUrl, durationMs: 680, loops: 1 },
  loading: { sheet: loadingSheetUrl, durationMs: 1200, loops: "infinite" },
  wave: { sheet: waveSheetUrl, durationMs: 900, loops: 1 }
};

const FRAME_COUNT = 8;

export function CodexPet({
  state,
  paused,
  lookOffset = { x: 0, y: 0 },
  microAction = ""
}: CodexPetProps) {
  const frameConfig = STATE_FRAMES[state];
  const [frameIndex, setFrameIndex] = useState(0);
  const spriteTransform = useMemo(
    () => `translate3d(-${(frameIndex * 100) / FRAME_COUNT}%, 0, 0)`,
    [frameIndex]
  );

  useEffect(() => {
    const preloadUrls = Object.values(STATE_FRAMES).map(({ sheet }) => sheet);
    preloadUrls.forEach((url) => {
      const image = new Image();
      image.decoding = "sync";
      image.src = url;
    });
  }, []);

  useEffect(() => {
    setFrameIndex(0);
  }, [state]);

  useEffect(() => {
    if (paused) {
      return;
    }

    const frameDurationMs = frameConfig.durationMs / FRAME_COUNT;
    const startedAt = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const nextFrame =
        frameConfig.loops === "infinite"
          ? Math.floor((elapsed % frameConfig.durationMs) / frameDurationMs)
          : Math.min(FRAME_COUNT - 1, Math.floor(elapsed / frameDurationMs));

      setFrameIndex((current) => (current === nextFrame ? current : nextFrame));

      if (frameConfig.loops === "infinite" || nextFrame < FRAME_COUNT - 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [frameConfig.durationMs, frameConfig.loops, paused, state]);

  const style = {
    "--frame-count": FRAME_COUNT,
    "--look-x": `${lookOffset.x}px`,
    "--look-y": `${lookOffset.y}px`
  } as CSSProperties;

  return (
    <div
      className={`state-pet state-${state} ${paused ? "is-paused" : ""} ${microAction}`}
      style={style}
    >
      <div className="state-pet-shadow" />
      <div className="state-pet-viewport">
        <div aria-hidden="true" className="state-pet-frame">
          <img
            key={`${state}-${frameConfig.sheet}`}
            className="state-pet-sprite-sheet"
            decoding="sync"
            draggable={false}
            src={frameConfig.sheet}
            style={{ transform: spriteTransform }}
          />
        </div>
      </div>
    </div>
  );
}
