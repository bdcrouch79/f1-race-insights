import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t riq-divider mt-24">
      <div className="riq-container flex flex-col gap-6 py-10 text-sm text-riq-gray sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-display text-base tracking-wide text-riq-white">
            RACE<span className="text-riq-cyan">IQ</span>
          </p>
          <p>
            RaceIQ is an independent motorsport analytics project and is not affiliated with
            Formula 1, the FIA, any team, or any driver.
          </p>
          <p>
            Built by{" "}
            <a
              href="https://crouchdevelopment.com"
              className="underline decoration-riq-gray/50 underline-offset-2 hover:text-riq-white"
            >
              Crouch Development
            </a>
            .
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/archive" className="hover:text-riq-white">
            Race Library
          </Link>
          <Link href="/methodology" className="hover:text-riq-white">
            Methodology
          </Link>
          <Link href="/about" className="hover:text-riq-white">
            About
          </Link>
          <a
            href="https://github.com/bdcrouch79/f1-race-insights"
            className="hover:text-riq-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
