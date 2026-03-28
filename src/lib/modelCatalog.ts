export type ModelProvider = "openai" | "gemini";

/** Curated lists aligned with provider docs (see OpenAI & Google AI model references). */
export type ModelOption = { id: string; label: string };

export const OPENAI_MODELS: ModelOption[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 nano" },
  { id: "o3-mini", label: "o3-mini" },
  { id: "o3", label: "o3" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

/** Text generation models (chat) — excludes image, TTS, live audio, embeddings. */
export const GEMINI_MODELS: ModelOption[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash-Lite (preview)" },
];

const openaiIds = new Set(OPENAI_MODELS.map((m) => m.id));
const geminiIds = new Set(GEMINI_MODELS.map((m) => m.id));

export function modelsForProvider(p: ModelProvider): ModelOption[] {
  return p === "openai" ? OPENAI_MODELS : GEMINI_MODELS;
}

export function defaultModelForProvider(p: ModelProvider): string {
  return p === "openai" ? "gpt-4o-mini" : "gemini-2.5-flash";
}

/** If stored model is unknown (e.g. renamed), fall back to default. */
export function normalizeModel(provider: ModelProvider, model: string): string {
  const ids = provider === "openai" ? openaiIds : geminiIds;
  if (ids.has(model)) return model;
  return defaultModelForProvider(provider);
}

export function isAllowedModel(provider: ModelProvider, model: string): boolean {
  const ids = provider === "openai" ? openaiIds : geminiIds;
  return ids.has(model);
}
