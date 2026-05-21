import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import type { PetState } from "./shared/types";
import casualSheetUrl from "../assets/preview/sea-lady-casual/casual-sheet.webp?url";

type FrameConfig = {
  durationMs: number;
  loops: "infinite" | 1;
  sheet: string;
};

type LoadedSheet = FrameConfig & {
  image: HTMLImageElement;
};

type TransitionRecord = {
  fromState: PetState;
  fromStartedAt: number;
  toState: PetState;
  toStartedAt: number;
  startedAt: number;
  durationMs: number;
};

type MotionProfile = {
  enterX: number;
  enterY: number;
  enterScale: number;
  enterRotate: number;
  exitX: number;
  exitY: number;
  exitScale: number;
  exitRotate: number;
};

type DrawTransform = {
  alpha: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

const FRAME_COUNT = 8;
const CANVAS_WIDTH = 440;
const CANVAS_HEIGHT = 600;
const PET_DRAW_WIDTH = 292;
const PET_DRAW_HEIGHT = 532;
const SHADOW_WIDTH = 156;
const TRANSITION_DURATION_MS = 560;
const TOUR_INTERVAL_MS = 1800;

const STATE_ORDER: PetState[] = [
  "idle",
  "listen",
  "talk",
  "think",
  "happy",
  "angry",
  "sleep",
  "surprised",
  "loading",
  "wave"
];

const STATE_LABELS: Record<PetState, string> = {
  idle: "待机",
  listen: "倾听",
  talk: "说话",
  think: "思考",
  happy: "开心",
  angry: "不高兴",
  sleep: "睡眠",
  surprised: "惊讶",
  loading: "处理中",
  wave: "招手"
};

const STATE_FRAMES: Record<PetState, FrameConfig> = {
  idle: { sheet: casualSheetUrl, durationMs: 1200, loops: "infinite" },
  talk: { sheet: casualSheetUrl, durationMs: 1300, loops: "infinite" },
  think: { sheet: casualSheetUrl, durationMs: 1400, loops: "infinite" },
  listen: { sheet: casualSheetUrl, durationMs: 1200, loops: "infinite" },
  happy: { sheet: casualSheetUrl, durationMs: 1200, loops: "infinite" },
  angry: { sheet: casualSheetUrl, durationMs: 900, loops: "infinite" },
  sleep: { sheet: casualSheetUrl, durationMs: 1800, loops: "infinite" },
  surprised: { sheet: casualSheetUrl, durationMs: 680, loops: 1 },
  loading: { sheet: casualSheetUrl, durationMs: 1200, loops: "infinite" },
  wave: { sheet: casualSheetUrl, durationMs: 900, loops: 1 }
};

const MOTION_PROFILES: Record<PetState, MotionProfile> = {
  idle: {
    enterX: 0,
    enterY: 10,
    enterScale: 0.985,
    enterRotate: -0.8,
    exitX: 0,
    exitY: -8,
    exitScale: 0.992,
    exitRotate: 0.5
  },
  listen: {
    enterX: -8,
    enterY: 10,
    enterScale: 0.985,
    enterRotate: -1.5,
    exitX: 6,
    exitY: -6,
    exitScale: 0.99,
    exitRotate: 0.6
  },
  talk: {
    enterX: 6,
    enterY: 8,
    enterScale: 0.986,
    enterRotate: 1.2,
    exitX: -4,
    exitY: -6,
    exitScale: 0.99,
    exitRotate: -0.7
  },
  think: {
    enterX: -6,
    enterY: 12,
    enterScale: 0.985,
    enterRotate: -1.1,
    exitX: 4,
    exitY: -4,
    exitScale: 0.992,
    exitRotate: 0.4
  },
  happy: {
    enterX: 0,
    enterY: 14,
    enterScale: 0.978,
    enterRotate: -0.5,
    exitX: 0,
    exitY: -12,
    exitScale: 0.99,
    exitRotate: 0.5
  },
  angry: {
    enterX: 0,
    enterY: 8,
    enterScale: 0.99,
    enterRotate: -0.3,
    exitX: 0,
    exitY: -4,
    exitScale: 0.994,
    exitRotate: 0.2
  },
  sleep: {
    enterX: 0,
    enterY: 18,
    enterScale: 0.975,
    enterRotate: -0.8,
    exitX: 0,
    exitY: -2,
    exitScale: 0.994,
    exitRotate: 0.2
  },
  surprised: {
    enterX: 0,
    enterY: 16,
    enterScale: 0.968,
    enterRotate: 1.1,
    exitX: 0,
    exitY: -12,
    exitScale: 0.988,
    exitRotate: -0.6
  },
  loading: {
    enterX: 4,
    enterY: 10,
    enterScale: 0.984,
    enterRotate: 0.9,
    exitX: -3,
    exitY: -6,
    exitScale: 0.991,
    exitRotate: -0.4
  },
  wave: {
    enterX: 10,
    enterY: 8,
    enterScale: 0.984,
    enterRotate: 1.8,
    exitX: -6,
    exitY: -8,
    exitScale: 0.99,
    exitRotate: -0.8
  }
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "sync";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function getInterpolatedFrame(config: FrameConfig, elapsedMs: number) {
  if (config.loops === 1) {
    const progress = clamp(elapsedMs / config.durationMs, 0, 1);
    const scaled = progress * (FRAME_COUNT - 1);
    const baseIndex = Math.floor(scaled);
    const nextIndex = Math.min(FRAME_COUNT - 1, baseIndex + 1);
    return { baseIndex, nextIndex, mix: scaled - baseIndex };
  }

  const cycleProgress =
    (((elapsedMs % config.durationMs) + config.durationMs) % config.durationMs) / config.durationMs;
  const scaled = cycleProgress * FRAME_COUNT;
  const baseIndex = Math.floor(scaled) % FRAME_COUNT;
  const nextIndex = (baseIndex + 1) % FRAME_COUNT;
  return { baseIndex, nextIndex, mix: scaled - Math.floor(scaled) };
}

function buildEnterTransform(state: PetState, progress: number): DrawTransform {
  const profile = MOTION_PROFILES[state];
  const eased = easeOutCubic(progress);
  return {
    alpha: clamp(lerp(0, 1, easeInOutCubic(progress)), 0, 1),
    x: lerp(profile.enterX, 0, eased),
    y: lerp(profile.enterY, 0, eased),
    scale: lerp(profile.enterScale, 1, easeOutBack(progress)),
    rotate: lerp(profile.enterRotate, 0, eased)
  };
}

function buildExitTransform(state: PetState, progress: number): DrawTransform {
  const profile = MOTION_PROFILES[state];
  const eased = easeInOutCubic(progress);
  return {
    alpha: clamp(lerp(1, 0, progress), 0, 1),
    x: lerp(0, profile.exitX, eased),
    y: lerp(0, profile.exitY, eased),
    scale: lerp(1, profile.exitScale, eased),
    rotate: lerp(0, profile.exitRotate, eased)
  };
}

function drawPetFrame(
  ctx: CanvasRenderingContext2D,
  sheet: LoadedSheet,
  frameIndex: number,
  transform: DrawTransform
) {
  if (transform.alpha <= 0) {
    return;
  }

  const frameWidth = sheet.image.naturalWidth / FRAME_COUNT;
  const frameHeight = sheet.image.naturalHeight;
  const destX = CANVAS_WIDTH / 2 + transform.x;
  const destY = CANVAS_HEIGHT / 2 + 10 + transform.y;

  ctx.save();
  ctx.translate(destX, destY);
  ctx.rotate((transform.rotate * Math.PI) / 180);
  ctx.scale(transform.scale, transform.scale);
  ctx.globalAlpha = transform.alpha;
  ctx.drawImage(
    sheet.image,
    frameWidth * frameIndex,
    0,
    frameWidth,
    frameHeight,
    -PET_DRAW_WIDTH / 2,
    -PET_DRAW_HEIGHT / 2,
    PET_DRAW_WIDTH,
    PET_DRAW_HEIGHT
  );
  ctx.restore();
}

function drawInterpolatedState(
  ctx: CanvasRenderingContext2D,
  sheet: LoadedSheet,
  elapsedMs: number,
  transform: DrawTransform
) {
  const { baseIndex, nextIndex, mix } = getInterpolatedFrame(sheet, elapsedMs);
  drawPetFrame(ctx, sheet, baseIndex, { ...transform, alpha: transform.alpha * (1 - mix) });
  drawPetFrame(ctx, sheet, nextIndex, { ...transform, alpha: transform.alpha * mix });
}

function drawShadow(ctx: CanvasRenderingContext2D, alpha: number, scale: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 72);
  ctx.scale(scale, 1);
  const gradient = ctx.createRadialGradient(0, 0, 6, 0, 0, SHADOW_WIDTH / 2);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.28)");
  gradient.addColorStop(0.66, "rgba(15, 23, 42, 0.1)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, SHADOW_WIDTH / 2, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedSheets, setLoadedSheets] = useState<Record<PetState, LoadedSheet> | null>(null);
  const [activeState, setActiveState] = useState<PetState>("idle");
  const [enteredAt, setEnteredAt] = useState(0);
  const [transition, setTransition] = useState<TransitionRecord | null>(null);
  const [now, setNow] = useState(0);
  const [autoTour, setAutoTour] = useState(true);

  const labels = useMemo(
    () =>
      STATE_ORDER.map((state) => ({
        state,
        label: STATE_LABELS[state]
      })),
    []
  );

  useEffect(() => {
    const initialTime = performance.now();
    setNow(initialTime);
    setEnteredAt(initialTime);

    Promise.all(
      STATE_ORDER.map(async (state) => {
        const config = STATE_FRAMES[state];
        const image = await loadImage(config.sheet);
        return [state, { ...config, image }] as const;
      })
    ).then((entries) => {
      setLoadedSheets(Object.fromEntries(entries) as Record<PetState, LoadedSheet>);
    });
  }, []);

  useEffect(() => {
    let rafId = 0;
    const tick = (frameNow: number) => {
      setNow(frameNow);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!autoTour) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveState((current) => {
        const currentIndex = STATE_ORDER.indexOf(current);
        const nextState = STATE_ORDER[(currentIndex + 1) % STATE_ORDER.length];
        const frameNow = performance.now();
        setTransition({
          fromState: current,
          fromStartedAt: enteredAt,
          toState: nextState,
          toStartedAt: frameNow,
          startedAt: frameNow,
          durationMs: TRANSITION_DURATION_MS
        });
        setEnteredAt(frameNow);
        return nextState;
      });
    }, TOUR_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [autoTour, enteredAt]);

  useEffect(() => {
    if (!transition || now < transition.startedAt + transition.durationMs) {
      return;
    }
    setTransition((current) =>
      current && now >= current.startedAt + current.durationMs ? null : current
    );
  }, [now, transition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedSheets) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!transition) {
      drawShadow(ctx, 0.9, 1);
      drawInterpolatedState(
        ctx,
        loadedSheets[activeState],
        now - enteredAt,
        { alpha: 1, x: 0, y: 0, scale: 1, rotate: 0 }
      );
      return;
    }

    const progress = clamp((now - transition.startedAt) / transition.durationMs, 0, 1);
    const eased = easeInOutCubic(progress);
    const enterTransform = buildEnterTransform(transition.toState, eased);
    const exitTransform = buildExitTransform(transition.fromState, eased);

    drawShadow(ctx, lerp(0.88, 0.94, eased), lerp(0.98, 1.03, eased));
    drawInterpolatedState(
      ctx,
      loadedSheets[transition.fromState],
      now - transition.fromStartedAt,
      exitTransform
    );
    drawInterpolatedState(
      ctx,
      loadedSheets[transition.toState],
      now - transition.toStartedAt,
      enterTransform
    );
  }, [activeState, enteredAt, loadedSheets, now, transition]);

  const handleStateClick = (nextState: PetState) => {
    setAutoTour(false);
    setActiveState((current) => {
      if (current === nextState) {
        const frameNow = performance.now();
        setEnteredAt(frameNow);
        setTransition(null);
        return current;
      }

      const frameNow = performance.now();
      setTransition({
        fromState: current,
        fromStartedAt: enteredAt,
        toState: nextState,
        toStartedAt: frameNow,
        startedAt: frameNow,
        durationMs: TRANSITION_DURATION_MS
      });
      setEnteredAt(frameNow);
      return nextState;
    });
  };

  return (
    <div style={shellStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>桌宠状态过渡预览</div>
          <h1 style={titleStyle}>先看效果，不改主逻辑</h1>
          <p style={descStyle}>
            这个案例把每个状态内部做了插帧混合，状态切换时再做连续过渡，目标是更像一段顺滑动作而不是硬切图片。
          </p>
        </div>
        <button
          onClick={() => setAutoTour((value) => !value)}
          style={{
            ...toggleStyle,
            background: autoTour ? "#f8fafc" : "rgba(30, 41, 59, 0.92)",
            color: autoTour ? "#0f172a" : "#e2e8f0"
          }}
        >
          {autoTour ? "自动巡览中" : "开启自动巡览"}
        </button>
      </div>

      <div style={previewCardStyle}>
        <div style={canvasWrapStyle}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={canvasStyle}
          />
        </div>
        <div style={metaStyle}>
          <span style={pillStyle}>当前状态：{STATE_LABELS[activeState]}</span>
          <span style={subtleStyle}>切换时长：{TRANSITION_DURATION_MS}ms</span>
          <span style={subtleStyle}>内部播放：连续混合帧</span>
        </div>
      </div>

      <div style={panelStyle}>
        {labels.map(({ state, label }) => (
          <button
            key={state}
            onClick={() => handleStateClick(state)}
            style={{
              ...chipStyle,
              ...(state === activeState ? activeChipStyle : null)
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px",
  background:
    "radial-gradient(circle at top, rgba(22, 78, 99, 0.32), rgba(2, 6, 23, 0) 34%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
  color: "#e2e8f0",
  fontFamily: "\"Segoe UI\", system-ui, sans-serif"
};

const headerStyle: CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px"
};

const eyebrowStyle: CSSProperties = {
  fontSize: "12px",
  letterSpacing: 0,
  color: "#7dd3fc",
  marginBottom: "10px"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.08
};

const descStyle: CSSProperties = {
  margin: "10px 0 0",
  maxWidth: "720px",
  color: "#94a3b8",
  lineHeight: 1.6,
  fontSize: "14px"
};

const toggleStyle: CSSProperties = {
  flexShrink: 0,
  height: "42px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  cursor: "pointer"
};

const previewCardStyle: CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "rgba(15, 23, 42, 0.82)",
  boxShadow: "0 22px 48px rgba(2, 6, 23, 0.34)"
};

const canvasWrapStyle: CSSProperties = {
  minHeight: "620px",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at 50% 36%, rgba(15, 118, 110, 0.18), rgba(15, 23, 42, 0) 44%)"
};

const canvasStyle: CSSProperties = {
  width: "440px",
  maxWidth: "100%",
  height: "600px"
};

const metaStyle: CSSProperties = {
  marginTop: "12px",
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  alignItems: "center"
};

const pillStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 12px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(15, 118, 110, 0.18)",
  color: "#ccfbf1",
  border: "1px solid rgba(45, 212, 191, 0.24)",
  fontSize: "13px"
};

const subtleStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px"
};

const panelStyle: CSSProperties = {
  maxWidth: "1120px",
  margin: "18px auto 0",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "10px"
};

const chipStyle: CSSProperties = {
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(30, 41, 59, 0.9)",
  color: "#e2e8f0",
  cursor: "pointer"
};

const activeChipStyle: CSSProperties = {
  background: "#f8fafc",
  color: "#0f172a",
  borderColor: "rgba(248, 250, 252, 0.82)"
};

createRoot(document.getElementById("root")!).render(<App />);
