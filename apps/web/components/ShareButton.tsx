"use client";

import { useState } from "react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      if (navigator.share) {
        await navigator.share({ url, title });
        return;
      }
    } catch {
      // fall through to clipboard copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; no-op, button remains a harmless no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border riq-divider px-4 py-2 text-sm font-medium text-riq-white riq-hover-lift"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
