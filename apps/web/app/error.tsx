"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="riq-container py-24 text-center">
      <p className="font-display text-3xl text-riq-white">Something went wrong</p>
      <p className="mt-3 text-riq-gray">RaceIQ hit an unexpected error rendering this page.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md border riq-divider px-5 py-2.5 text-sm font-medium text-riq-white"
      >
        Try again
      </button>
    </div>
  );
}
