"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, CalendarDays, NotebookPen, Clapperboard, Globe } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/studio", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/studio/proyek", label: "Proyek", icon: FolderKanban },
  { href: "/studio/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/studio/laporan", label: "Laporan", icon: NotebookPen },
  { href: "/studio/portofolio", label: "Portofolio", icon: Clapperboard },
];

function aktif(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/studio" ? pathname === "/studio" : pathname.startsWith(href);
}

export default function StudioNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-denim-100 bg-white sm:flex print:hidden">
        <div className="border-b border-denim-100 px-5 py-5">
          <p className="font-display text-base text-denim-700">Duamimbar</p>
          <p className="text-xs text-muted">Studio Produksi</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                aktif(pathname, href) ? "bg-denim-700 text-white" : "text-denim-900 hover:bg-surface"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface"
          >
            <Globe size={18} strokeWidth={1.75} />
            Lihat situs
          </Link>
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-denim-100 px-4 py-3">
          <p className="truncate text-xs text-muted">{email}</p>
          <LogoutButton />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-denim-100 bg-white/95 py-2 backdrop-blur-md sm:hidden print:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = aktif(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${on ? "text-denim-700" : "text-muted"}`}
            >
              <Icon size={20} strokeWidth={on ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
