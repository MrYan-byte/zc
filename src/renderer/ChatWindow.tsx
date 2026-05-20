import { Send, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../shared/types";
import { electronApi } from "./electronApi";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    electronApi.chat.history().then(setMessages);
    const offDelta = electronApi.chat.onDelta((delta) => {
      setStreamingText((current) => current + delta);
    });
    const offDone = electronApi.chat.onDone((message) => {
      setMessages((current) => [...current, message]);
      setStreamingText("");
      setIsSending(false);
    });
    const offError = electronApi.chat.onError((message) => {
      setError(message);
      setStreamingText("");
      setIsSending(false);
    });

    return () => {
      offDelta();
      offDone();
      offError();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streamingText]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setError("");
    setStreamingText("");
    setIsSending(true);

    const result = await electronApi.chat.send({ message: content });
    if (!result.ok) {
      setMessages((current) =>
        current.filter((item) => item.id !== optimisticMessage.id)
      );
      setError(result.error ?? "发送失败。");
      setIsSending(false);
    }
  }

  async function clearHistory() {
    setMessages(await electronApi.chat.clear());
    setStreamingText("");
    setError("");
  }

  return (
    <main className="panel-shell chat-shell">
      <header className="panel-header">
        <div>
          <h1>桌宠聊天</h1>
          <p>文字对话</p>
        </div>
        <button
          className="icon-button"
          type="button"
          title="清空"
          onClick={clearHistory}
        >
          <Trash2 size={18} />
        </button>
      </header>

      <section className="message-list" aria-live="polite">
        {messages.length === 0 && !streamingText ? (
          <div className="empty-state">...</div>
        ) : null}
        {messages.map((message) => (
          <article
            className={`message message-${message.role}`}
            key={message.id}
          >
            {message.content}
          </article>
        ))}
        {streamingText ? (
          <article className="message message-assistant is-streaming">
            {streamingText}
          </article>
        ) : null}
        <div ref={scrollRef} />
      </section>

      {error ? <div className="error-line">{error}</div> : null}

      <form className="chat-form" onSubmit={sendMessage}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="输入消息"
          rows={3}
        />
        <button className="primary-button send-button" type="submit">
          <Send size={18} />
          <span>{isSending ? "发送中" : "发送"}</span>
        </button>
      </form>
    </main>
  );
}
