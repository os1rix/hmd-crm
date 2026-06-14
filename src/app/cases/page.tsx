import { CasesPageSkeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import CasesPageClient from "./cases-client";

export default function CasesPage() {
  return (
    <Suspense fallback={<CasesPageSkeleton />}>
      <CasesPageClient />
    </Suspense>
  );
}
