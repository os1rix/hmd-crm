import { Suspense } from "react";
import CasesPageClient from "./cases-client";

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading cases…</div>}>
      <CasesPageClient />
    </Suspense>
  );
}
