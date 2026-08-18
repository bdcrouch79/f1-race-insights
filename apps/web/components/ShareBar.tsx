"use client";

import { useState } from "react";

/**
 * Compact on-site sharing controls for a race report (Phase 3, Part 4):
 * copy the report link, open a LinkedIn/X share intent, and download the
 * race's insight graphic when one has been generated (see
 * lib/contentCards.ts). No auth, no social APIs, no server-side posting
 * -- every control is a plain client-side link or clipboard write.
 */
export function ShareBar({ url, title, imageUrl }: { url: string; title: string; imageUrl?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; no-op, button remains a harmless no-op
    }
  }

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  const buttonClass =
    "rounded-md border riq-divider px-3.5 py-2 text-sm font-medium text-riq-white riq-hover-lift";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a href={linkedInHref} target="_blank" rel="noreferrer" className={buttonClass}>
        Share on LinkedIn
      </a>
      <a href={xHref} target="_blank" rel="noreferrer" className={buttonClass}>
        Share on X
      </a>
      {imageUrl ? (
        <a href={imageUrl} download className={buttonClass}>
          Download graphic
        </a>
      ) : null}
    </div>
  );
}
