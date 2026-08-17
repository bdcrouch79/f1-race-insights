import type { ReactNode } from "react";

/** Progressive disclosure for secondary content (evidence tables, methodology, disclaimers). */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="riq-details riq-panel p-6" open={defaultOpen}>
      <summary className="flex items-center justify-between gap-2 font-display text-xl tracking-wide text-riq-white">
        {title}
        <span className="riq-details-chevron text-riq-gray" aria-hidden>
          &rsaquo;
        </span>
      </summary>
      <div className="mt-4 border-t riq-divider pt-4">{children}</div>
    </details>
  );
}
