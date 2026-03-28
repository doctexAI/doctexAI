import {
  defaultModelForProvider,
  normalizeModel,
  type ModelProvider,
} from "@/lib/modelCatalog";

export const SETTINGS_KEY = "doctex-settings";

export type { ModelProvider } from "@/lib/modelCatalog";

export type AiSettings = {
  /** Stored API key (browser localStorage only). */
  apiKey: string;
  model: string;
  provider: ModelProvider;
};

export const defaultAiSettings: AiSettings = {
  apiKey: "",
  model: defaultModelForProvider("openai"),
  provider: "openai",
};

const defaults = defaultAiSettings;

type LegacySettings = AiSettings & { baseUrl?: string };

export function loadSettings(): AiSettings {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<LegacySettings>;
    const apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey : defaults.apiKey;

    const provider: ModelProvider =
      parsed.provider === "gemini" || parsed.provider === "openai"
        ? parsed.provider
        : "openai";

    let model =
      typeof parsed.model === "string" && parsed.model.trim()
        ? parsed.model.trim()
        : defaultModelForProvider(provider);

    model = normalizeModel(provider, model);

    return { apiKey, model, provider };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s: Partial<AiSettings>): AiSettings {
  const cur = loadSettings();
  const provider: ModelProvider =
    s.provider === "gemini" || s.provider === "openai"
      ? s.provider
      : s.provider !== undefined
        ? cur.provider
        : cur.provider;

  let model =
    s.model !== undefined && s.model.trim() ? s.model.trim() : cur.model;
  model = normalizeModel(provider, model);

  const next: AiSettings = {
    apiKey: s.apiKey !== undefined ? s.apiKey : cur.apiKey,
    model,
    provider,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export const DOC_KEY = "doctex-document-html";

export function loadDocumentHtml(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DOC_KEY);
}

export function saveDocumentHtml(html: string): void {
  localStorage.setItem(DOC_KEY, html);
}
