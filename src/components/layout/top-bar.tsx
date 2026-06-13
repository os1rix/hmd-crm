"use client";

import { fetchList } from "@/lib/fetch-client";
import { roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/session";
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

type UserOption = { id: string; name: string; role: string };

export function TopBar({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchList<Notification>("/api/notifications").then(setNotifications);
  }, [user]);

  useEffect(() => {
    fetchList<UserOption>("/api/users").then(setUsers);
  }, []);

  async function login(userId: string) {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-6">
        <p className="text-sm text-muted">Select a demo user to begin</p>
        <div className="flex flex-wrap gap-2">
          {users.length === 0 ? (
            <p className="text-xs text-muted">Loading users… (run db:seed if this persists)</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => login(u.id)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
              >
                {u.name} · {roleLabel(u.role)}
              </button>
            ))
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-sidebar px-6">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Search accounts, deals, cases…"
          className="w-full max-w-md rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
        {roleLabel(user.role)}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-accent"
        >
          🔔
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
            <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase text-muted">
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
      <select
        value={user.id}
        onChange={(e) => login(e.target.value)}
        className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={logout} className="text-xs text-muted hover:text-foreground">
        Logout
      </button>
    </header>
  );
}
