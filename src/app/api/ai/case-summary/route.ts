import { callAi } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(request: Request) {
  const { notes } = (await request.json()) as { notes: string[] };

  try {
    const summary = await callAi(
      "Summarize this support case history in one paragraph for a TAM handoff.",
      [{ role: "user", content: notes.join("\n---\n") }],
    );
    return apiSuccess({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
