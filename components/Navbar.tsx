import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function Navbar({ nama }: { nama: string }) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-denim-100">
      <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <span className="font-display text-lg text-denim-700">Duamimbar</span>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/home" className="text-denim-900 hover:text-denim-500">
            Home
          </Link>
          <Link href="/my-page" className="text-denim-900 hover:text-denim-500">
            My Page
          </Link>
          <span className="text-muted hidden sm:inline">{nama}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
