"use client";

import { ToastProvider } from "@/components/ui/toast";
import type { SessionUser } from "@/lib/session";
import { useState } from "react";
import { NewsFeed } from "./news-feed";
import { ShellLogo } from "./shell-logo";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const [newsOpen, setNewsOpen] = useState(true);

  if (!user) {
    return (
      <ToastProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
          <div className="flex h-20 shrink-0 items-center border-b border-border px-6">
            <ShellLogo user={user} />
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</main>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div
        className={`grid h-screen overflow-hidden bg-background text-foreground ${
          newsOpen
            ? "grid-cols-[220px_minmax(0,1fr)_260px] grid-rows-[5rem_minmax(0,1fr)]"
            : "grid-cols-[220px_minmax(0,1fr)] grid-rows-[5rem_minmax(0,1fr)]"
        }`}
      >
        <div className="col-start-1 row-start-1 flex items-center border-b border-r border-border px-4">
          <ShellLogo user={user} />
        </div>
        <div className="col-start-2 row-start-1 flex items-center border-b border-border px-6">
          <TopBar user={user} onToggleNews={() => setNewsOpen((v) => !v)} newsOpen={newsOpen} />
        </div>
        {newsOpen && (
          <div className="col-start-3 row-start-1 row-span-2 hidden min-h-0 xl:block">
            <NewsFeed />
          </div>
        )}
        <div className="col-start-1 row-start-2 flex flex-col overflow-hidden border-r border-border">
          <Sidebar user={user} />
        </div>
        <main
          key={user.id}
          className="col-start-2 row-start-2 min-h-0 overflow-y-auto scrollbar-thin"
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
