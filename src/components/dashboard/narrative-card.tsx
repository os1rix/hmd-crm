"use client";

import { Card } from "@/components/ui/card";
import { NarrativeSkeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export function NarrativeCard({
  summary,
}: {
  summary: {
    totalPipeline: number;
    openDeals: number;
    stalled: number;
  };
}) {
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/forecast-narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary }),
        });
        const json = await res.json();
        if (!cancelled) setNarrative(json.narrative ?? json.data?.narrative ?? "");
      } catch {
        if (!cancelled) setNarrative("Unable to generate pipeline narrative.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [summary]);

  async function regenerate() {
    setLoading(true);
    const res = await fetch("/api/ai/forecast-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });
    const json = await res.json();
    setNarrative(json.narrative ?? json.data?.narrative ?? "");
    setLoading(false);
  }

  return (
    <Card className="mb-6 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium uppercase tracking-widest text-section">
          AI pipeline narrative
        </h2>
        <button
          type="button"
          onClick={regenerate}
          disabled={loading}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>
      {loading ? (
        <NarrativeSkeleton />
      ) : (
        <p className="text-sm leading-relaxed text-muted">{narrative}</p>
      )}
    </Card>
  );
}
