import Link from "next/link";

const NAV_LINKS = [
  { href: "/archive", label: "Archive" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b riq-divider bg-riq-black/95 backdrop-blur supports-[backdrop-filter]:bg-riq-black/80 sticky top-0 z-40">
      <div className="riq-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-wide">
          <span className="inline-block h-2 w-2 rounded-full bg-riq-red" aria-hidden />
          RACE<span className="text-riq-cyan">IQ</span>
        </Link>
        <nav aria-label="Primary" className="hidden gap-6 text-sm text-riq-gray sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-riq-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/archive"
          className="rounded-md bg-riq-panel px-4 py-2 text-sm font-medium text-riq-white riq-hover-lift border riq-divider"
        >
          Analyze a Race
        </Link>
      </div>
    </header>
  );
}
