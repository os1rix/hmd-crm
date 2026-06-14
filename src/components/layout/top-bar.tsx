"use client";

import { SearchBar } from "@/components/layout/search-bar";
import { fetchList } from "@/lib/fetch-client";
import type { SessionUser } from "@/lib/session";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function TopBar({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchList<Notification>("/api/notifications").then(setNotifications);
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return <div className="h-full w-full" />;
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-full w-full items-center gap-4">
      <SearchBar />
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative rounded-lg border border-border p-2 text-muted hover:border-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-card-border bg-background shadow-xl">
              <div className="border-b border-border px-4 py-2 text-[13px] font-medium uppercase tracking-widest text-section">
                Notifications
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "#"}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-border px-4 py-3 text-sm hover:bg-background ${n.isRead ? "opacity-60" : ""}`}
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted">{n.body}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={logout} className="text-xs text-muted hover:text-foreground">
          Logout
        </button>
      </div>
    </div>
  );
}
