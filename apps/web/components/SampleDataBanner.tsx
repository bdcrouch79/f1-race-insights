export function SampleDataBanner() {
  return (
    <div
      role="status"
      className="riq-panel flex items-start gap-3 border-riq-orange/40 bg-riq-orange/5 px-4 py-3 text-sm"
    >
      <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-riq-orange" aria-hidden />
      <p>
        <strong className="text-riq-white">Sample data.</strong>{" "}
        <span className="text-riq-gray">
          This report uses a synthetic fixture built to verify the RaceIQ interface. No driver,
          team, lap time, or result shown here is real. See{" "}
          <a href="/methodology" className="underline underline-offset-2 hover:text-riq-white">
            methodology
          </a>{" "}
          for how real analyses are generated.
        </span>
      </p>
    </div>
  );
}
