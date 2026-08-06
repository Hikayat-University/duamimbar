import Link from "next/link";
import { House, LayoutGrid, User, Users } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";

/**
 * Navbar mengambang — fixed di atas, pill rounded-full, kaca semi-transparan
 * (blend di atas foto hero maupun halaman putih biasa). Karena "fixed",
 * navbar ini lepas dari document flow: setiap page.tsx lain (My Project,
 * Profile, Kelola User) WAJIB kasih padding-top ke <main>-nya (pt-24) biar
 * kontennya nggak ketiban navbar. Home nggak perlu, karena section Hero
 * memang didesain penuh 1 layar di belakang navbar.
 */
export default function Navbar({ nama, role }: { nama: string; role?: string }) {
  return (
    <div className="fixed inset-x-3 top-3 z-30 sm:inset-x-4">
      <header className="mx-auto max-w-3xl rounded-full border border-white/50 bg-white/70 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2 sm:px-5">
          <span className="font-display text-base text-denim-700">Duamimbar</span>
          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link
              href="/home"
              title="Home"
              className="flex flex-col items-center gap-0.5 rounded-full px-2 py-1 text-denim-900 transition-colors hover:bg-white/60 hover:text-denim-700"
            >
              <House size={18} strokeWidth={1.75} />
              <span className="hidden text-[10px] sm:inline">Home</span>
            </Link>
            <Link
              href="/my-project"
              title="My Project"
              className="flex flex-col items-center gap-0.5 rounded-full px-2 py-1 text-denim-900 transition-colors hover:bg-white/60 hover:text-denim-700"
            >
              <LayoutGrid size={18} strokeWidth={1.75} />
              <span className="hidden text-[10px] sm:inline">My Project</span>
            </Link>
            <Link
              href="/profile"
              title="Profile"
              className="flex flex-col items-center gap-0.5 rounded-full px-2 py-1 text-denim-900 transition-colors hover:bg-white/60 hover:text-denim-700"
            >
              <User size={18} strokeWidth={1.75} />
              <span className="hidden text-[10px] sm:inline">Profile</span>
            </Link>
            {role === "head_director" && (
              <Link
                href="/admin/users"
                title="Kelola User"
                className="flex flex-col items-center gap-0.5 rounded-full px-2 py-1 text-denim-900 transition-colors hover:bg-white/60 hover:text-denim-700"
              >
                <Users size={18} strokeWidth={1.75} />
                <span className="hidden text-[10px] sm:inline">User</span>
              </Link>
            )}
            <span className="mx-1 hidden text-xs text-muted md:inline">{nama}</span>
            <NotificationBell />
            <LogoutButton />
          </nav>
        </div>
      </header>
    </div>
  );
}
