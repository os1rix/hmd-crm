"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelative } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

type NewsPost = {
  id: string;
  title: string | null;
  body: string;
  createdAt: string;
  author: { name: string; role: string };
};

export function NewsFeed() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      setBody("");
      load();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-widest text-section">CRM News</h2>
        <p className="text-[11px] text-muted">Team updates & pipeline wins</p>
      </div>

      <div className="border-b border-border p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Share an update with the team…"
          className="mb-2 w-full resize-none border border-border bg-background p-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={posting || !body.trim()}
          className="w-full bg-accent py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post update"}
        </button>
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto scrollbar-thin">
        {posts.length === 0 ? (
          <p className="p-4 text-sm text-muted">No news yet — be the first to post.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="border-b border-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <UserAvatar name={post.author.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.author.name}</p>
                  <p className="text-[10px] text-muted">{formatRelative(post.createdAt)}</p>
                </div>
              </div>
              {post.title && <p className="mb-1 text-sm font-medium">{post.title}</p>}
              <p className="text-sm text-muted">{post.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
