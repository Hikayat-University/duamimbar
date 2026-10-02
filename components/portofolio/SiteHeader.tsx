import Link from "next/link";

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay ? "text-white" : "text-denim-900";
  return (
    <header
      className={`${overlay ? "absolute" : "relative border-b border-denim-100 bg-white"} inset-x-0 top-0 z-20`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className={`font-display text-lg ${tone}`}>
          Duamimbar <span className="font-sans font-normal opacity-60">Produksi</span>
        </Link>
        <nav className={`flex items-center gap-5 text-sm ${tone}`}>
          <Link href="/#karya" className="hover:opacity-70">
            Karya
          </Link>
          <Link href="/#kontak" className="hover:opacity-70">
            Kontak
          </Link>
          <Link
            href="/studio"
            className={`rounded-full px-3.5 py-1.5 ${
              overlay ? "border border-white/40 hover:bg-white/10" : "border border-denim-100 hover:border-denim-300"
            }`}
          >
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
