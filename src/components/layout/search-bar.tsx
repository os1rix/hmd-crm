"use client";

import { Card } from "@/components/ui/card";
import { SearchResultsSkeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchResult = {
  type: "account" | "deal" | "case";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type AiSearchResponse = {
  answer: string;
  results: SearchResult[];
  filters?: Record<string, string>;
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setAiAnswer("");
      return;
    }
    setLoading(true);
    try {
      const isConversational =
        q.length > 20 || /\?|at-risk|stalled|enterprise|DACH|pipeline/i.test(q);
      if (isConversational) {
        const res = await fetch("/api/ai/search-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = (await res.json()) as AiSearchResponse;
        setAiAnswer(data.answer ?? "");
        setResults(data.results ?? []);
      } else {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setAiAnswer("");
      }
    } catch {
      setResults([]);
      setAiAnswer("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md transition-all ${focused ? "max-w-xl" : ""}`}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) navigate(results[0].href);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search accounts, deals, cases…"
        className="w-full rounded-full border border-border/60 bg-dirty-white px-4 py-2 text-sm text-black placeholder:text-low-gray focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
      {open && query.trim() && (
        <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto bg-black shadow-xl">
          {loading && <SearchResultsSkeleton />}
          {!loading && aiAnswer && (
            <div className="border-b border-border px-4 py-3">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-section">
                <Sparkles className="h-3 w-3" />
                AI answer
              </div>
              <p className="text-sm text-muted">{aiAnswer}</p>
            </div>
          )}
          {!loading && results.length === 0 && !aiAnswer && (
            <p className="px-4 py-3 text-sm text-muted">No results found</p>
          )}
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              onClick={() => navigate(r.href)}
              className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-background"
            >
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-section">
                {r.type}
              </span>
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted">{r.subtitle}</p>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
