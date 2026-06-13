import { callClaude } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(request: Request) {
  const { summary } = (await request.json()) as { summary: unknown };

  try {
    const narrative = await callClaude(
      "Write a 3-5 sentence finance executive summary of CRM pipeline health. Mention weighted value, biggest deals, and risks.",
      [{ role: "user", content: JSON.stringify(summary) }],
    );
    return apiSuccess({ narrative });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
