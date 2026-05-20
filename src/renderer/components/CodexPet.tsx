import type { CSSProperties } from "react";
import type { PetState } from "../../shared/types";
import angryUrl from "../../../assets/characters/sea-lady/angry.webp?url";
import happyUrl from "../../../assets/characters/sea-lady/happy.webp?url";
import idleUrl from "../../../assets/characters/sea-lady/idle.webp?url";
import listenUrl from "../../../assets/characters/sea-lady/listen.webp?url";
import loadingUrl from "../../../assets/characters/sea-lady/loading.webp?url";
import sleepUrl from "../../../assets/characters/sea-lady/sleep.webp?url";
import surprisedUrl from "../../../assets/characters/sea-lady/surprised.webp?url";
import talkUrl from "../../../assets/characters/sea-lady/talk.webp?url";
import thinkUrl from "../../../assets/characters/sea-lady/think.webp?url";

interface CodexPetProps {
  state: PetState;
  paused: boolean;
  lookOffset?: { x: number; y: number };
  microAction?: string;
}

const STATE_ASSET: Record<PetState, string> = {
  idle: idleUrl,
  talk: talkUrl,
  think: thinkUrl,
  listen: listenUrl,
  happy: happyUrl,
  angry: angryUrl,
  sleep: sleepUrl,
  surprised: surprisedUrl,
  loading: loadingUrl
};

export function CodexPet({
  state,
  paused,
  lookOffset = { x: 0, y: 0 },
  microAction = ""
}: CodexPetProps) {
  const style = {
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
        <img
          alt=""
          className="state-pet-image"
          draggable={false}
          src={STATE_ASSET[state]}
        />
        <div className="state-pet-eye-mask" />
      </div>
    </div>
  );
}
