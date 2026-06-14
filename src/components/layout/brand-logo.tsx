"use client";

import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  onClick,
  href,
  compact = false,
}: {
  onClick?: () => void;
  href?: string;
  compact?: boolean;
}) {
  const content = (
    <div className={`flex items-center ${onClick || href ? "cursor-pointer" : ""}`}>
      <Image
        src="/hmd-secure-logo.png"
        alt="HMD Secure"
        width={compact ? 120 : 200}
        height={compact ? 36 : 60}
        className={`shrink-0 brightness-0 invert ${compact ? "h-8 w-auto" : "h-16 w-auto"}`}
        priority
      />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left transition-opacity hover:opacity-80"
        aria-label="Back to role selection"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
