"use client";

import { SearchBar } from "@/components/layout/search-bar";
import { fetchList } from "@/lib/fetch-client";
import type { SessionUser } from "@/lib/session";
import { Bell, Newspaper } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function TopBar({
  user,
  onToggleNews,
  newsOpen,
}: {
  user: SessionUser | null;
  onToggleNews?: () => void;
  newsOpen?: boolean;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchList<Notification>("/api/notifications").then(setNotifications);
  }, [user]);

  if (!user) {
    return <div className="h-full w-full" />;
  }

  const unread = notifications.filter((n) => !n.isRead).length;
  const topBtn =
    "flex h-9 items-center border border-border bg-surface text-muted hover:text-foreground";

  return (
    <div className="flex h-full w-full items-center gap-4">
      <SearchBar />
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleNews}
          className={`${topBtn} gap-1.5 px-3 text-xs font-medium ${
            newsOpen ? "border-accent/50 bg-accent/10 text-accent" : ""
          }`}
        >
          <Newspaper className="h-4 w-4" />
          Hot news
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className={`${topBtn} relative justify-center px-2`}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-danger text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 border border-card-border bg-background shadow-xl">
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
                      onClick={() => setNotifOpen(false)}
                      className={`block border-b border-border px-4 py-3 text-sm hover:bg-surface ${n.isRead ? "opacity-60" : ""}`}
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
      </div>
    </div>
  );
}
