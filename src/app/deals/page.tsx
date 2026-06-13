import { Suspense } from "react";
import DealsPageClient from "./deals-client";

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading pipeline…</div>}>
      <DealsPageClient />
    </Suspense>
  );
}
