import { SettingsClient } from "@/app/settings/settings-client";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return <SettingsClient user={user} />;
}
