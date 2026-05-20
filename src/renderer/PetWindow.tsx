import { MessageCircle, Send, Settings, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PetRuntimeState } from "../shared/types";
import { DEFAULT_PET_STATE } from "../shared/defaults";
import { CodexPet } from "./components/CodexPet";
import { electronApi } from "./electronApi";

const THINKING_TEXT = "让我想一下。";

export function PetWindow() {
  const [runtime, setRuntime] = useState<PetRuntimeState>(DEFAULT_PET_STATE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [bubbleText, setBubbleText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bubbleTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    electronApi.pet.getState().then(setRuntime);
    const offRuntime = electronApi.pet.onRuntimeState(setRuntime);
    const offInline = electronApi.app.onInlineChatOpen(() => {
      setComposerOpen(true);
      void electronApi.pet.setState("listen");
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
      void electronApi.pet.setState("happy");
      startBubbleDismissTimer();
    });
    const offError = electronApi.chat.onError((message) => {
      setIsSending(false);
      setError(message);
      setBubbleText(message);
      void electronApi.pet.setState("angry");
      startBubbleDismissTimer();
    });

    return () => {
      offRuntime();
      offInline();
      offDelta();
      offDone();
      offError();
      clearBubbleDismissTimer();
    };
  }, []);

  useEffect(() => {
    if (!composerOpen && !isSending && !bubbleText) {
      void electronApi.pet.setState("idle");
    }
    if (!composerOpen) {
      setDraft("");
      setError("");
    }
  }, [bubbleText, composerOpen, isSending]);

  function clearBubbleDismissTimer() {
    if (bubbleTimerRef.current !== null) {
      window.clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
  }

  function startBubbleDismissTimer() {
    clearBubbleDismissTimer();
    bubbleTimerRef.current = window.setTimeout(() => {
      setBubbleText("");
      void electronApi.pet.setState("idle");
      bubbleTimerRef.current = null;
    }, 9000);
  }

  const visibleBubble = useMemo(() => {
    if (bubbleText.trim()) {
      return bubbleText;
    }
    if (runtime.state === "think") {
      return THINKING_TEXT;
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

    setComposerOpen(false);
    setError("");
    setIsSending(true);
    setBubbleText(THINKING_TEXT);
    clearBubbleDismissTimer();
    await electronApi.pet.setState("think");

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
    setComposerOpen((current) => {
      const next = !current;
      void electronApi.pet.setState(next ? "listen" : "idle");
      if (next) {
        window.setTimeout(() => inputRef.current?.focus(), 60);
      }
      return next;
    });
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
            onChange={(event) => setDraft(event.target.value)}
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

      <button
        className="pet-stage"
        type="button"
        aria-label="切换聊天输入"
        onClick={toggleComposer}
      >
        <CodexPet state={runtime.state} paused={runtime.paused} />
      </button>

      <div className="pet-actions">
        <button
          className="icon-button"
          type="button"
          title="聊天"
          onClick={toggleComposer}
        >
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
