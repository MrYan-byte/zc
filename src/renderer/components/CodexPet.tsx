import type { PetState } from "../../shared/types";
import angryUrl from "../../../assets/characters/sea-lady/angry.webp?url";
import happyUrl from "../../../assets/characters/sea-lady/happy.webp?url";
import idleUrl from "../../../assets/characters/sea-lady/idle.webp?url";
import listenUrl from "../../../assets/characters/sea-lady/listen.webp?url";
import talkUrl from "../../../assets/characters/sea-lady/talk.webp?url";
import thinkUrl from "../../../assets/characters/sea-lady/think.webp?url";

interface CodexPetProps {
  state: PetState;
  paused: boolean;
}

const STATE_ASSET: Record<PetState, string> = {
  idle: idleUrl,
  talk: talkUrl,
  think: thinkUrl,
  listen: listenUrl,
  happy: happyUrl,
  angry: angryUrl
};

export function CodexPet({ state, paused }: CodexPetProps) {
  return (
    <div className={`state-pet state-${state} ${paused ? "is-paused" : ""}`}>
      <div className="state-pet-shadow" />
      <div className="state-pet-viewport">
        <img
          alt=""
          className="state-pet-image"
          draggable={false}
          src={STATE_ASSET[state]}
        />
      </div>
    </div>
  );
}
