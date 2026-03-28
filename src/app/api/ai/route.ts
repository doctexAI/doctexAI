import { NextRequest } from "next/server";
import { isAllowedModel, type ModelProvider } from "@/lib/modelCatalog";

const OPENAI_BASE = "https://api.openai.com/v1";

type ChatMessage = { role: string; content: string };

type Body = {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  provider?: ModelProvider;
};

function toGeminiPayload(messages: ChatMessage[]) {
  const systemChunks: string[] = [];
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemChunks.push(m.content);
    } else if (m.role === "user") {
      contents.push({ role: "user", parts: [{ text: m.content }] });
    } else if (m.role === "assistant") {
      contents.push({ role: "model", parts: [{ text: m.content }] });
    }
  }
  const systemInstruction =
    systemChunks.length > 0 ? { parts: [{ text: systemChunks.join("\n\n") }] } : undefined;
  return { systemInstruction, contents };
}

function extractGeminiText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") return "";
  const c = chunk as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const parts = c.candidates?.[0]?.content?.parts;
  if (!parts?.length) return "";
  return parts.map((p) => p.text ?? "").join("");
}

function openAiSseChunk(content: string): string {
  const payload = JSON.stringify({
    choices: [{ delta: { content } }],
  });
  return `data: ${payload}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, model, apiKey } = body;
  const provider: ModelProvider =
    body.provider === "gemini" || body.provider === "openai" ? body.provider : "openai";

  if (!apiKey?.trim()) {
    return new Response(JSON.stringify({ error: "Add your API key in Settings." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!model?.trim()) {
    return new Response(JSON.stringify({ error: "Choose a model in Settings." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isAllowedModel(provider, model.trim())) {
    return new Response(JSON.stringify({ error: "Unknown or unsupported model for this provider." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (provider === "openai") {
    const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(err || upstream.statusText, { status: upstream.status });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const { systemInstruction, contents } = toGeminiPayload(messages);
  if (contents.length === 0) {
    return new Response(JSON.stringify({ error: "No messages to send to Gemini." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const geminiBody: Record<string, unknown> = { contents };
  if (systemInstruction) {
    geminiBody.systemInstruction = systemInstruction;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey.trim(),
    },
    body: JSON.stringify(geminiBody),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err || upstream.statusText, { status: upstream.status });
  }

  if (!upstream.body) {
    return new Response(JSON.stringify({ error: "Empty response from Gemini." }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = upstream.body!.getReader();
      const dec = new TextDecoder();
      let lineBuffer = "";
      let textAccumulated = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuffer += dec.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            let parsed: unknown;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              continue;
            }
            const text = extractGeminiText(parsed);
            if (!text) continue;

            let delta = "";
            if (textAccumulated && text.startsWith(textAccumulated)) {
              delta = text.slice(textAccumulated.length);
              textAccumulated = text;
            } else {
              delta = text;
              textAccumulated += text;
            }
            if (delta) {
              controller.enqueue(enc.encode(openAiSseChunk(delta)));
            }
          }
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
