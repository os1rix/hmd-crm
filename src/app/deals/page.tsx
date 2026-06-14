import { PipelinePageSkeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/session";
import { Suspense } from "react";
import DealsPageClient from "./deals-client";

export default async function DealsPage() {
  const user = await getSessionUser();

  return (
    <Suspense fallback={<PipelinePageSkeleton />}>
      <DealsPageClient user={user} />
    </Suspense>
  );
}
