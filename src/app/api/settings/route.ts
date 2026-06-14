import { db } from "@/db";
import { users } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
  mergePreferences,
} from "@/lib/user-preferences";
import { updateSettingsSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });
    if (!user) return apiError("Not found", 404);

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? null,
      preferences: mergePreferences(user.preferences ?? DEFAULT_USER_PREFERENCES),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return apiError(message);
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, updateSettingsSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });
    if (!existing) return apiError("Not found", 404);

    const currentPrefs = mergePreferences(existing.preferences ?? DEFAULT_USER_PREFERENCES);
    let nextPrefs: UserPreferences | undefined;

    if (parsed.data.preferences) {
      const incoming = parsed.data.preferences;
      nextPrefs = {
        language: incoming.language ?? currentPrefs.language,
        appearance: incoming.appearance ?? currentPrefs.appearance,
        notifications: {
          ...currentPrefs.notifications,
          ...(incoming.notifications ?? {}),
        },
      };
    }

    const [updated] = await db
      .update(users)
      .set({
        name: parsed.data.name ?? existing.name,
        bio: parsed.data.bio !== undefined ? parsed.data.bio : existing.bio,
        avatarUrl: parsed.data.avatarUrl !== undefined ? parsed.data.avatarUrl : existing.avatarUrl,
        preferences: nextPrefs ?? currentPrefs,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.id))
      .returning();

    return apiSuccess({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      bio: updated.bio ?? "",
      avatarUrl: updated.avatarUrl ?? null,
      preferences: mergePreferences(updated.preferences ?? DEFAULT_USER_PREFERENCES),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return apiError(message);
  }
}
