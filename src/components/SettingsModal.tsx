"use client";

import { useEffect, useId, useState } from "react";
import type { AiSettings, ModelProvider } from "@/lib/settings";
import { loadSettings, saveSettings } from "@/lib/settings";
import { modelsForProvider, normalizeModel } from "@/lib/modelCatalog";
import {
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  X,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (s: AiSettings) => void;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 dark:border-surface-border dark:bg-surface dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-accent/20";

const labelClass = "mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300";

export function SettingsModal({ open, onClose, onSaved }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [showKey, setShowKey] = useState(false);
  const baseId = useId();
  const providerGroupId = `${baseId}-provider`;

  useEffect(() => {
    if (!open) return;
    const s = loadSettings();
    setApiKey(s.apiKey);
    setProvider(s.provider);
    setModel(normalizeModel(s.provider, s.model));
  }, [open]);

  if (!open) return null;

  function handleProviderChange(next: ModelProvider) {
    setProvider(next);
    setModel((prev) => normalizeModel(next, prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = saveSettings({ apiKey, model, provider });
    onSaved(next);
    onClose();
  }

  const modelOptions = modelsForProvider(provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        className="relative max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-surface-border dark:bg-surface-raised"
        role="dialog"
        aria-labelledby={`${baseId}-title`}
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-surface-border dark:bg-surface-raised/95">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent dark:bg-accent/15">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                id={`${baseId}-title`}
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                AI connection
              </h2>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-500">
                Keys stay in your browser only. Choose a provider, model, and paste your API key.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-surface-overlay dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div>
            <span className={labelClass} id={providerGroupId}>
              Model provider
            </span>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-labelledby={providerGroupId}
            >
              <button
                type="button"
                role="radio"
                aria-checked={provider === "openai"}
                onClick={() => handleProviderChange("openai")}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition ${
                  provider === "openai"
                    ? "border-accent bg-accent/10 ring-2 ring-accent/30 dark:bg-accent/15"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-surface-border dark:hover:border-zinc-600 dark:hover:bg-surface-overlay"
                }`}
              >
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  OpenAI
                </span>
                <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                  GPT-4o, o3, GPT-4.1, …
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={provider === "gemini"}
                onClick={() => handleProviderChange("gemini")}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition ${
                  provider === "gemini"
                    ? "border-accent bg-accent/10 ring-2 ring-accent/30 dark:bg-accent/15"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-surface-border dark:hover:border-zinc-600 dark:hover:bg-surface-overlay"
                }`}
              >
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Google Gemini
                </span>
                <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                  Gemini 2.5, 3 preview, …
                </span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`${baseId}-model`} className={labelClass}>
              Model name
            </label>
            <div className="relative">
              <select
                id={`${baseId}-model`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`${inputClass} cursor-pointer appearance-none pr-10`}
              >
                {modelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600"
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-600">
              {provider === "openai"
                ? "Uses the OpenAI Chat Completions API (streaming)."
                : "Uses the Gemini API generateContent stream (mapped for this app)."}
            </p>
          </div>

          <div>
            <label htmlFor={`${baseId}-key`} className={labelClass}>
              API key
            </label>
            <div className="relative">
              <input
                id={`${baseId}-key`}
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`${inputClass} pr-11 font-mono text-[13px]`}
                placeholder={provider === "openai" ? "sk-…" : "AIza…"}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-surface-overlay dark:hover:text-zinc-200"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              {provider === "openai" ? (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline dark:text-blue-400"
                >
                  Get an OpenAI key
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : (
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline dark:text-blue-400"
                >
                  Get a Gemini key
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 dark:border-surface-border dark:bg-surface-overlay/60">
            <div className="flex gap-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-500">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              <span>
                Provider and model are stored with your key in{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-400">localStorage</span>.
                Nothing is sent to our servers except through your Next.js API route to the
                provider you picked.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-surface-overlay dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-muted"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
