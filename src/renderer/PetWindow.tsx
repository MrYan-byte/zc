import { MessageCircle, Send, Settings, X } from "lucide-react";
import {
  FormEvent,
  MutableRefObject,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { DEFAULT_PET_STATE } from "../shared/defaults";
import type { PetRuntimeState, PetState } from "../shared/types";
import { CodexPet } from "./components/CodexPet";
import { electronApi } from "./electronApi";

type MicroAction =
  | ""
  | "micro-blink"
  | "micro-head-tilt"
  | "micro-hair-touch"
  | "micro-eye-move"
  | "micro-think-mini"
  | "micro-message-pop";

const THINKING_TEXT = "让我想一下。";
const NO_INTERACTION_MS = 60_000;

export function PetWindow() {
  const [runtime, setRuntime] = useState<PetRuntimeState>(DEFAULT_PET_STATE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [bubbleText, setBubbleText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const [microAction, setMicroAction] = useState<MicroAction>("");
  const [interactionCount, setInteractionCount] = useState(0);
  const [clickBurstCount, setClickBurstCount] = useState(0);

  const bubbleTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const clickBurstTimerRef = useRef<number | null>(null);
  const microLoopTimerRef = useRef<number | null>(null);

  function clearTimer(ref: MutableRefObject<number | null>) {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }

  function resetIdleTimer() {
    clearTimer(idleTimerRef);
    idleTimerRef.current = window.setTimeout(() => {
      if (!composerOpen && !isSending) {
        void electronApi.pet.setState("sleep");
      }
    }, NO_INTERACTION_MS);
  }

  function trackInteraction() {
    setInteractionCount((count) => count + 1);
    resetIdleTimer();
    if (runtime.state === "sleep") {
      void electronApi.pet.setState("idle");
    }
  }

  function clearBubbleDismissTimer() {
    clearTimer(bubbleTimerRef);
  }

  function startBubbleDismissTimer() {
    clearBubbleDismissTimer();
    bubbleTimerRef.current = window.setTimeout(() => {
      setBubbleText("");
      if (!composerOpen && !isSending) {
        void electronApi.pet.setState("idle");
      }
      bubbleTimerRef.current = null;
    }, 9000);
  }

  function triggerMicroAction(action: MicroAction, duration = 1200) {
    setMicroAction(action);
    window.setTimeout(() => {
      setMicroAction((current) => (current === action ? "" : current));
    }, duration);
  }

  function queueRandomMicroAction() {
    clearTimer(microLoopTimerRef);
    const delay = 3000 + Math.random() * 7000;
    microLoopTimerRef.current = window.setTimeout(() => {
      if (!composerOpen && !isSending && runtime.state === "idle") {
        const actionPool: MicroAction[] = [
          "micro-blink",
          "micro-eye-move",
          "micro-head-tilt",
          "micro-hair-touch",
          "micro-think-mini"
        ];
        const action = actionPool[Math.floor(Math.random() * actionPool.length)];
        triggerMicroAction(action, action === "micro-blink" ? 260 : 1400);
      }
      queueRandomMicroAction();
    }, delay);
  }

  useEffect(() => {
    electronApi.pet.getState().then(setRuntime);
    const offRuntime = electronApi.pet.onRuntimeState(setRuntime);
    const offInline = electronApi.app.onInlineChatOpen(() => {
      setComposerOpen(true);
      void electronApi.pet.setState("listen");
      trackInteraction();
      window.setTimeout(() => inputRef.current?.focus(), 60);
    });
    const offDelta = electronApi.chat.onDelta((delta) => {
      setBubbleText((current) => {
        const seed = current === THINKING_TEXT ? "" : current;
        return `${seed}${delta}`;
      });
      void electronApi.pet.setState("talk");
    });
    const offDone = electronApi.chat.onDone((message) => {
      setIsSending(false);
      setDraft("");
      setBubbleText(message.content);
      triggerMicroAction("micro-message-pop", 900);
      void electronApi.pet.setState("surprised");
      window.setTimeout(() => {
        void electronApi.pet.setState(interactionCount >= 5 ? "happy" : "idle");
      }, 520);
      startBubbleDismissTimer();
    });
    const offError = electronApi.chat.onError((message) => {
      setIsSending(false);
      setError(message);
      setBubbleText(message);
      void electronApi.pet.setState("angry");
      startBubbleDismissTimer();
    });

    resetIdleTimer();
    queueRandomMicroAction();

    return () => {
      offRuntime();
      offInline();
      offDelta();
      offDone();
      offError();
      clearBubbleDismissTimer();
      clearTimer(idleTimerRef);
      clearTimer(clickBurstTimerRef);
      clearTimer(microLoopTimerRef);
    };
  }, [composerOpen, interactionCount, isSending, runtime.state]);

  useEffect(() => {
    if (!composerOpen && !isSending && !bubbleText && runtime.state !== "sleep") {
      void electronApi.pet.setState("idle");
    }
    if (!composerOpen) {
      setDraft("");
      setError("");
    }
  }, [bubbleText, composerOpen, isSending, runtime.state]);

  const visibleBubble = useMemo(() => {
    if (bubbleText.trim()) {
      return bubbleText;
    }
    if (runtime.state === "loading") {
      return THINKING_TEXT;
    }
    if (runtime.state === "sleep") {
      return "还没想好吗？";
    }
    if (runtime.state === "angry" && error) {
      return error;
    }
    return "";
  }, [bubbleText, error, runtime.state]);

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) {
      return;
    }

    trackInteraction();
    setComposerOpen(false);
    setError("");
    setIsSending(true);
    setBubbleText(THINKING_TEXT);
    clearBubbleDismissTimer();
    await electronApi.pet.setState("loading");

    const result = await electronApi.chat.send({ message });
    if (!result.ok) {
      setIsSending(false);
      const failure = result.error ?? "发送失败。";
      setError(failure);
      setBubbleText(failure);
      await electronApi.pet.setState("angry");
      startBubbleDismissTimer();
    }
  }

  function toggleComposer() {
    trackInteraction();
    setComposerOpen((current) => {
      const next = !current;
      void electronApi.pet.setState(next ? "listen" : "idle");
      if (next) {
        window.setTimeout(() => inputRef.current?.focus(), 60);
      }
      return next;
    });
  }

  async function handleCharacterClick() {
    trackInteraction();
    setClickBurstCount((count) => count + 1);
    clearTimer(clickBurstTimerRef);
    clickBurstTimerRef.current = window.setTimeout(() => {
      setClickBurstCount(0);
    }, 6000);

    if (clickBurstCount + 1 >= 10) {
      await electronApi.pet.setState("angry");
      setBubbleText("玩够了吗？");
      startBubbleDismissTimer();
      return;
    }

    const nextState: PetState = Math.random() < 0.7 ? "happy" : "angry";
    await electronApi.pet.setState(nextState);
    triggerMicroAction("micro-head-tilt", 900);
    window.setTimeout(() => {
      if (!composerOpen && !isSending) {
        void electronApi.pet.setState("idle");
      }
    }, 1200);
  }

  function handleSceneMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    setLookOffset({ x, y });
    if (!composerOpen && !isSending && runtime.state === "idle") {
      void electronApi.pet.setState("listen");
    }
  }

  function handleSceneMouseLeave() {
    setLookOffset({ x: 0, y: 0 });
    if (!composerOpen && !isSending && !bubbleText) {
      void electronApi.pet.setState("idle");
    }
  }

  return (
    <main className="pet-shell">
      {visibleBubble ? <div className="speech-bubble">{visibleBubble}</div> : null}

      {composerOpen ? (
        <form className="pet-composer" onSubmit={submitChat}>
          <input
            ref={inputRef}
            className="pet-composer-input"
            placeholder="输入消息"
            value={draft}
            onFocus={() => {
              trackInteraction();
              void electronApi.pet.setState("listen");
            }}
            onChange={(event) => {
              setDraft(event.target.value);
              trackInteraction();
              void electronApi.pet.setState("listen");
            }}
          />
          <button className="pet-mini-button" type="submit" title="发送">
            <Send size={16} />
          </button>
          <button
            className="pet-mini-button pet-mini-button-secondary"
            type="button"
            title="关闭"
            onClick={() => {
              setComposerOpen(false);
              setDraft("");
              void electronApi.pet.setState("idle");
            }}
          >
            <X size={16} />
          </button>
        </form>
      ) : null}

      {error && !composerOpen ? <div className="pet-error">{error}</div> : null}

      <div
        className="pet-scene"
        onMouseLeave={handleSceneMouseLeave}
        onMouseMove={handleSceneMouseMove}
      >
        <button
          className="pet-stage"
          type="button"
          aria-label="角色互动"
          onClick={handleCharacterClick}
        >
          <CodexPet
            state={runtime.state}
            paused={runtime.paused}
            lookOffset={lookOffset}
            microAction={microAction}
          />
        </button>
      </div>

      <div className="pet-actions">
        <button className="icon-button" type="button" title="聊天" onClick={toggleComposer}>
          <MessageCircle size={18} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="设置"
          onClick={() => electronApi.app.openSettings()}
        >
          <Settings size={18} />
        </button>
      </div>
    </main>
  );
}
