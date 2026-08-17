import Link from "next/link";

export default function RaceNotFound() {
  return (
    <div className="riq-container py-20">
      <div className="riq-panel mx-auto max-w-xl p-8 text-center">
        <p className="font-display text-2xl text-riq-white">Analysis not yet generated</p>
        <p className="mt-3 text-sm text-riq-gray">
          RaceIQ generates analyses out-of-band from FastF1 and commits the results as data
          artifacts, so only races that have already been generated have a report here. This one
          hasn&apos;t been generated yet.
        </p>
        <Link
          href="/archive"
          className="mt-6 inline-block rounded-md bg-riq-red px-5 py-2.5 text-sm font-medium text-riq-white"
        >
          See the Race Library
        </Link>
      </div>
    </div>
  );
}
