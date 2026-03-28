"use client";

import { useCallback, useRef, useState } from "react";
import type { AiSettings } from "@/lib/settings";
import { streamAiChat, type ChatMessage } from "@/lib/ai";
import {
  CornerDownLeft,
  Copy,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type Props = {
  settings: AiSettings;
  getDocumentHtml: () => string;
  getSelectionText: () => string;
  insertAtCursor: (text: string) => void;
};

const SYSTEM: ChatMessage = {
  role: "system",
  content:
    "You are an expert writing assistant inside a document editor. Help revise, expand, summarize, or rewrite based on the user's instruction. Be concise unless asked for detail. You may return plain text or minimal HTML fragments (<p>, <strong>, etc.) when appropriate.",
};

const QUICK_PROMPTS = [
  "Summarize the document",
  "Improve clarity and tone",
  "Fix grammar and spelling",
  "Make the selection more concise",
] as const;

export function PromptPanel({
  settings,
  getDocumentHtml,
  getSelectionText,
  insertAtCursor,
}: Props) {
  const [input, setInput] = useState("");
  /** User/assistant only — for display and for building API history */
  const [turns, setTurns] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSelection, setUseSelection] = useState(true);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    setError(null);
    const selection = getSelectionText().trim();
    const docSnippet = getDocumentHtml();
    const prior =
      turns.length > 0
        ? turns
            .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
            .join("\n\n")
        : "";

    const contextParts: string[] = [];
    if (useSelection && selection) {
      contextParts.push(`### Selected text\n${selection}`);
    }
    contextParts.push(`### Document (HTML)\n${docSnippet.slice(0, 120_000)}`);
    if (prior) {
      contextParts.push(`### Prior conversation\n${prior}`);
    }
    contextParts.push(`### Instruction\n${trimmed}`);

    const userPayload = contextParts.join("\n\n");
    const apiMessages: ChatMessage[] = [SYSTEM, { role: "user", content: userPayload }];

    setTurns((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setStreaming(true);

    let assistant = "";
    setTurns((prev) => [...prev, { role: "assistant", content: "" }]);
    queueMicrotask(() => scrollDown());

    try {
      await streamAiChat(settings, apiMessages, (delta) => {
        assistant += delta;
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: assistant };
          }
          return copy;
        });
        requestAnimationFrame(() => scrollDown());
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setTurns((prev) => prev.slice(0, -2));
    } finally {
      setStreaming(false);
      scrollDown();
    }
  }, [
    input,
    streaming,
    turns,
    settings,
    getDocumentHtml,
    getSelectionText,
    useSelection,
    scrollDown,
  ]);

  const lastAssistant =
    [...turns].reverse().find((m) => m.role === "assistant")?.content ?? "";

  function clearConversation() {
    if (turns.length === 0) return;
    setTurns([]);
    setError(null);
  }

  async function copyLastReply() {
    if (!lastAssistant.trim()) return;
    try {
      await navigator.clipboard.writeText(lastAssistant);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 dark:border-surface-border dark:from-surface dark:to-surface-raised">
      {/* Header */}
      <div className="flex shrink-0 items-start gap-2 border-b border-zinc-200/90 px-3 py-2.5 dark:border-surface-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent dark:bg-accent/15">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            Assistant
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
            Uses your document each turn. Add an API key in Settings.
          </p>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            className="shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-surface-overlay dark:hover:text-zinc-200"
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {turns.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/50 p-3 dark:border-surface-border dark:bg-surface-overlay/40">
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Start with a prompt
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-500">
              Selection is included when it&apos;s turned on and you have text
              selected. Shift+Enter for a new line.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={streaming}
                  onClick={() => {
                    setInput(label);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700 transition hover:border-accent/40 hover:bg-accent/5 hover:text-zinc-900 disabled:opacity-50 dark:border-surface-border dark:bg-surface-raised dark:text-zinc-300 dark:hover:border-accent/30 dark:hover:bg-surface-overlay dark:hover:text-zinc-100"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {turns.map((m, i) => {
            const isUser = m.role === "user";
            const isLast = i === turns.length - 1;
            const isThinking =
              !isUser &&
              streaming &&
              isLast &&
              m.content === "";

            return (
              <li
                key={i}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(100%,20rem)] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                    isUser
                      ? "rounded-br-md border border-emerald-200/80 bg-emerald-50 text-zinc-900 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-zinc-100"
                      : "rounded-bl-md border border-zinc-200/90 bg-white text-zinc-800 dark:border-surface-border dark:bg-surface-overlay dark:text-zinc-200"
                  }`}
                >
                  <div
                    className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                      isUser
                        ? "text-emerald-700 dark:text-emerald-400/90"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {isUser ? "You" : "Assistant"}
                  </div>
                  {isThinking ? (
                    <div className="flex items-center gap-1.5 py-0.5 text-zinc-500 dark:text-zinc-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      <span className="text-[11px]">Writing…</span>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                      {m.content}
                    </pre>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          className="shrink-0 border-t border-red-200/90 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 space-y-2 border-t border-zinc-200/90 bg-white/90 p-3 backdrop-blur-sm dark:border-surface-border dark:bg-surface-raised/95">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-500">
            Context
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={useSelection}
            aria-label="Include selection when non-empty"
            onClick={() => setUseSelection((v) => !v)}
            className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-raised ${
              useSelection ? "bg-accent" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                useSelection ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-600">
          {useSelection
            ? "Include current selection when it’s not empty."
            : "Selection ignored — full document only."}
        </p>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask for edits, a summary, or a rewrite…"
            rows={3}
            disabled={streaming}
            className="min-h-[80px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 pr-12 text-sm text-zinc-900 shadow-inner placeholder:text-zinc-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60 dark:border-surface-border dark:bg-surface-overlay dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
            className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow-sm transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-40"
            title="Send (Enter)"
            aria-label="Send message"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600">
          Enter to send · Shift+Enter new line
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!lastAssistant.trim() || streaming}
            onClick={() => void copyLastReply()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-surface-border dark:text-zinc-300 dark:hover:bg-surface-overlay"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy reply"}
          </button>
          <button
            type="button"
            disabled={!lastAssistant.trim() || streaming}
            onClick={() => insertAtCursor(lastAssistant)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 py-2 text-[11px] font-medium text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-accent/40 dark:bg-accent/15 dark:hover:bg-accent/25"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
            Insert at cursor
          </button>
        </div>
      </div>
    </div>
  );
}
