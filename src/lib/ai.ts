type AiMessage = { role: "user" | "assistant"; content: string };

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/** DeepSeek key — use GEMINI_API_KEY on Container App (legacy name) or DEEPSEEK_API_KEY. */
function deepseekApiKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY ?? process.env.GEMINI_API_KEY;
}

export function isAiConfigured(): boolean {
  return Boolean(deepseekApiKey() || process.env.ANTHROPIC_API_KEY);
}

/** Server-only — DeepSeek (primary) or Anthropic fallback. */
export async function callAi(
  system: string,
  messages: AiMessage[],
  maxTokens = 1024,
): Promise<string> {
  if (deepseekApiKey()) {
    return callDeepSeek(system, messages, maxTokens);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaude(system, messages, maxTokens);
  }
  return "AI unavailable — set GEMINI_API_KEY (DeepSeek) or ANTHROPIC_API_KEY on the server.";
}

async function callDeepSeek(
  system: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = deepseekApiKey();
  if (!apiKey) {
    throw new Error("DeepSeek API key is not set");
  }

  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
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
