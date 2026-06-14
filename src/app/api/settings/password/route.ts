import { db } from "@/db";
import { users } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSessionUser } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, changePasswordSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return apiError("New password must be different from current password", 400);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });
    if (!user) return apiError("Not found", 404);

    if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      return apiError("Current password is incorrect", 400);
    }

    await db
      .update(users)
      .set({
        passwordHash: hashPassword(parsed.data.newPassword),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.id));

    return apiSuccess({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change password";
    return apiError(message);
  }
}
