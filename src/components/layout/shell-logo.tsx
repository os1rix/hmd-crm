"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import type { SessionUser } from "@/lib/session";
import { useRouter } from "next/navigation";

export function ShellLogo({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  async function goToRoleSelection() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (user) {
    return <BrandLogo onClick={goToRoleSelection} />;
  }

  return <BrandLogo href="/" />;
}
