import Link from "next/link";
import { House, LayoutGrid, User, Users } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function Navbar({ nama, role }: { nama: string; role?: string }) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-denim-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between">
        <span className="font-display text-lg text-denim-700">Duamimbar</span>
        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          <Link
            href="/home"
            title="Home"
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-denim-900 hover:bg-denim-50 hover:text-denim-700 transition-colors"
          >
            <House size={19} strokeWidth={1.75} />
            <span className="hidden sm:inline text-xs">Home</span>
          </Link>
          <Link
            href="/my-project"
            title="My Project"
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-denim-900 hover:bg-denim-50 hover:text-denim-700 transition-colors"
          >
            <LayoutGrid size={19} strokeWidth={1.75} />
            <span className="hidden sm:inline text-xs">My Project</span>
          </Link>
          <Link
            href="/profile"
            title="Profile"
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-denim-900 hover:bg-denim-50 hover:text-denim-700 transition-colors"
          >
            <User size={19} strokeWidth={1.75} />
            <span className="hidden sm:inline text-xs">Profile</span>
          </Link>
          {role === "head_director" && (
            <Link
              href="/admin/users"
              title="Kelola User"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-denim-900 hover:bg-denim-50 hover:text-denim-700 transition-colors"
            >
              <Users size={19} strokeWidth={1.75} />
              <span className="hidden sm:inline text-xs">User</span>
            </Link>
          )}
          <span className="text-muted hidden md:inline text-xs mx-1">{nama}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
