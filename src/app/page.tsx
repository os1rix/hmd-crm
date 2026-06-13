import Link from "next/link";

const modules = [
  {
    href: "/accounts",
    label: "Accounts",
    description: "Customer accounts, contacts, and timeline",
  },
  { href: "/deals", label: "Deals", description: "Pipeline stages, forecasts, and offers" },
  { href: "/cases", label: "Cases", description: "Service cases, notes, and SLA tracking" },
  { href: "/catalog", label: "Catalog", description: "Products, services, and pricing" },
  {
    href: "/forecast",
    label: "Forecast",
    description: "Weighted pipeline and time-phased revenue",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-muted">HMD Secure</p>
            <h1 className="text-2xl font-semibold">AI-native CRM</h1>
          </div>
          <span className="rounded-full bg-accent-muted px-3 py-1 text-sm font-medium text-accent">
            Dev mode
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Hackathon foundation</h2>
          <p className="max-w-3xl text-muted">
            Next.js App Router with server-side API routes, PostgreSQL via Drizzle, Zod validation,
            and Docker Compose. Entra ID auth will be wired in before Azure deployment.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-accent hover:shadow-md"
            >
              <h3 className="mb-1 font-semibold group-hover:text-accent">{module.label}</h3>
              <p className="text-sm text-muted">{module.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
