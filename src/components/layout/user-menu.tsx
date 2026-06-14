"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import { roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/session";
import { ChevronDown, HelpCircle, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserMenu({
  user,
  variant = "compact",
}: {
  user: SessionUser;
  variant?: "compact" | "sidebar";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isSidebar = variant === "sidebar";

  return (
    <div ref={ref} className={`relative ${isSidebar ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isSidebar
            ? "flex w-full items-center gap-3 px-1 py-1 text-left hover:opacity-90"
            : "flex items-center gap-2 border border-border bg-surface px-2 py-1.5 text-sm hover:border-card-hover"
        }
      >
        <UserAvatar name={user.name} imageUrl={user.avatarUrl} size={isSidebar ? "md" : "sm"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {isSidebar && <p className="text-[11px] text-muted">{roleLabel(user.role)}</p>}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute z-50 w-56 border border-card-border bg-background shadow-xl ${
            isSidebar ? "bottom-full left-0 mb-2" : "right-0 mt-1"
          }`}
        >
          {!isSidebar && (
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} imageUrl={user.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{roleLabel(user.role)}</p>
                </div>
              </div>
            </div>
          )}
          <div className="py-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <HelpCircle className="h-4 w-4" />
              Help & support
            </button>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
