type AiMessage = { role: "user" | "assistant"; content: string };

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/** Server-only — reads GEMINI_API_KEY or ANTHROPIC_API_KEY from process.env. */
export async function callAi(
  system: string,
  messages: AiMessage[],
  maxTokens = 1024,
): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    return callGemini(system, messages, maxTokens);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaude(system, messages, maxTokens);
  }
  return "AI unavailable — set GEMINI_API_KEY or ANTHROPIC_API_KEY on the server.";
}

async function callGemini(
  system: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function callClaude(
  system: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const block = data.content.find((item) => item.type === "text");
  return block?.text?.trim() ?? "";
}
