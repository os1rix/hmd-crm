import type { SessionUser } from "@/lib/session";
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
  if (!user) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="flex h-20 shrink-0 items-center border-b border-border px-6">
          <ShellLogo user={user} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[220px_minmax(0,1fr)] grid-rows-[5rem_minmax(0,1fr)] overflow-hidden bg-background text-foreground">
      <div className="flex items-center border-b border-r border-border bg-background px-4">
        <ShellLogo user={user} />
      </div>
      <div className="flex items-center border-b border-border bg-background px-6">
        <TopBar user={user} />
      </div>
      <div className="flex flex-col overflow-hidden border-r border-border bg-background">
        <Sidebar user={user} />
      </div>
      <main key={user.id} className="min-h-0 overflow-y-auto scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
