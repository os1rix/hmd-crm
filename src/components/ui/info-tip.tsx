"use client";

import { Info } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function InfoTip({ text }: { text: string }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [tooltip, setTooltip] = useState<{ top: number; left: number } | null>(null);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltip({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const hide = useCallback(() => setTooltip(null), []);

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex align-middle"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <button
          type="button"
          className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
          aria-label={text}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Info className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
      </span>
      {tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: tooltip.top,
              left: tooltip.left,
              transform: "translate(-50%, -100%)",
              zIndex: 2147483647,
            }}
            className="pointer-events-none w-56 border border-border bg-background px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-foreground shadow-xl"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}
