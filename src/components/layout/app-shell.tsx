import type { SessionUser } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && <Sidebar user={user} />}
      <div className={user ? "ml-56" : ""}>
        <TopBar user={user} />
        <main>{children}</main>
      </div>
    </div>
  );
}
