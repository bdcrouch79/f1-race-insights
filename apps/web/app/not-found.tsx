import Link from "next/link";

export default function NotFound() {
  return (
    <div className="riq-container py-24 text-center">
      <p className="font-display text-3xl text-riq-white">Page not found</p>
      <p className="mt-3 text-riq-gray">That page doesn&apos;t exist. Try the Race Library instead.</p>
      <Link href="/archive" className="mt-6 inline-block rounded-md bg-riq-red px-5 py-2.5 text-sm font-medium text-riq-white">
        Go to the Race Library
      </Link>
    </div>
  );
}
