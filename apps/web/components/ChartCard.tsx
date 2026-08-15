import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  methodology,
  children,
}: {
  title: string;
  description?: string;
  methodology?: string;
  children: ReactNode;
}) {
  return (
    <section className="riq-panel p-5 sm:p-6" aria-label={title}>
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="font-display text-lg tracking-wide text-riq-white">{title}</h3>
        {description ? <p className="text-sm text-riq-gray">{description}</p> : null}
      </div>
      <div className="w-full overflow-x-auto">{children}</div>
      {methodology ? (
        <p className="mt-4 border-t riq-divider pt-3 text-xs leading-relaxed text-riq-gray">{methodology}</p>
      ) : null}
    </section>
  );
}
