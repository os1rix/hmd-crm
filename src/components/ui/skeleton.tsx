export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-sm ${className}`} />;
}

export function NarrativeSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="w-full border border-border bg-surface/30 p-3">
      <Skeleton className="mb-1.5 h-3.5 w-[72%]" />
      <Skeleton className="mb-2 h-3 w-[88%]" />
      <Skeleton className="mb-2 h-3.5 w-[42%]" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="mt-2 h-6 w-6" />
    </div>
  );
}

const PIPELINE_CARD_COUNTS = [1, 1, 2, 1, 1, 1, 1];

export function PipelineSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_CARD_COUNTS.map((count, i) => (
        <div key={i} className="w-[240px] shrink-0 border border-border p-3">
          <Skeleton className="mb-3 h-3 w-24" />
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, j) => (
              <DealCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="border border-border bg-surface/30 p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-[65%]" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="mb-2 h-3 w-[48%]" />
      <Skeleton className="mb-3 h-3 w-[70%]" />
      <Skeleton className="mb-3 h-4 w-[36%]" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-[62%]" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-[48%]" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function AccountsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CaseRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-4 border border-border bg-surface/30 p-4">
      <Skeleton className="h-10 w-1 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-[55%]" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-3 w-[30%]" />
      </div>
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function CasesListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CaseRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function AccountDetailSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-4 h-4 w-96 max-w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-4 border-r border-border p-6">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[72%]" />
                  <Skeleton className="h-3 w-[34%]" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <Skeleton className="mt-3 h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface/30 p-3">
              <Skeleton className="mb-2 h-3 w-[38%]" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-2 h-8 w-72" />
      <Skeleton className="mb-6 h-4 w-96 max-w-full" />
      <div className="mb-8 rounded-xl border border-border bg-surface/30 p-5">
        <Skeleton className="mb-3 h-6 w-40" />
        <div className="mb-4 flex gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-36" />
          ))}
        </div>
        <Skeleton className="mt-3 h-4 w-48" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="mb-4 h-6 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/30 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              </div>
              <Skeleton className="mt-2 h-5 w-14" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="mb-4 h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/30 p-4">
              <Skeleton className="mb-2 h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-0.5 h-3 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[72%]" />
            <Skeleton className="h-3 w-[48%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EntityFiltersSkeleton() {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 border border-border bg-surface p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-[140px]">
          <Skeleton className="mb-1.5 h-2.5 w-14" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PipelinePageSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="mb-4 h-4 w-96 max-w-full" />
      <EntityFiltersSkeleton />
      <PipelineSkeleton />
    </div>
  );
}

export function AccountsPageSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-2 h-8 w-36" />
      <Skeleton className="mb-4 h-4 w-96 max-w-full" />
      <EntityFiltersSkeleton />
      <AccountsGridSkeleton />
    </div>
  );
}

export function CasesPageSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-4 h-8 w-24" />
      <EntityFiltersSkeleton />
      <CasesListSkeleton />
    </div>
  );
}
