import { db } from "@/db";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "hmd_user_id";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "sales_rep" | "tam" | "sales_manager" | "finance";
  bio: string | null;
  avatarUrl: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}
