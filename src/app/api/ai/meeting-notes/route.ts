import { callAi } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(request: Request) {
  const { notes, accountName } = (await request.json()) as {
    notes: string;
    accountName: string;
  };

  try {
    const text = await callAi(
      'Extract CRM updates from meeting notes. Reply JSON: {"stageChanges":[],"tasks":[],"contacts":[]}',
      [{ role: "user", content: `Account: ${accountName}\n\n${notes}` }],
    );

    try {
      return apiSuccess(JSON.parse(text));
    } catch {
      return apiSuccess({ raw: text });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
