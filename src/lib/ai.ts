const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

type ClaudeMessage = { role: "user" | "assistant"; content: string };

export async function callClaude(
  system: string,
  messages: ClaudeMessage[],
  maxTokens = 1024,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "AI unavailable — set ANTHROPIC_API_KEY in your environment.";
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
