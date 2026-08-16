"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  FolderKanban,
  CalendarDays,
  User,
  Users,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-project", label: "My Project", icon: LayoutGrid },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
];

/**
 * Sidebar kiri, sticky full-height. Default collapsed (icon doang) biar
 * hemat tempat di layar sempit — tinggal tap tombol panah buat expand
 * (icon + nama). Status collapse disimpan di localStorage supaya nggak
 * balik ke default tiap pindah halaman (di app ini navigasi antar
 * halaman = full page load, bukan SPA).
 */
export default function Sidebar({ nama, role }: { nama: string; role?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("duamimbar-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("duamimbar-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <aside
      className={`hidden sm:flex sticky top-0 self-start h-screen shrink-0 border-r border-denim-100 bg-white flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-denim-100">
        {!collapsed && <span className="font-display text-base text-denim-700">Duamimbar</span>}
        <button
          onClick={toggle}
          title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          className="p-1.5 rounded-lg text-denim-700 hover:bg-surface ml-auto"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-denim-700 text-white"
                  : "text-denim-900 hover:bg-surface"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {role === "head_director" && (
          <Link
            href="/admin/users"
            title="Kelola User"
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-colors ${
              pathname?.startsWith("/admin/users")
                ? "bg-denim-700 text-white"
                : "text-denim-900 hover:bg-surface"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Users size={18} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span className="truncate">Kelola User</span>}
          </Link>
        )}
      </nav>

      <div
        className={`px-2 py-3 border-t border-denim-100 flex items-center gap-2 ${
          collapsed ? "flex-col" : "justify-between"
        }`}
      >
        <NotificationBell />
        <LogoutButton />
      </div>

      {!collapsed && (
        <p className="px-4 pb-3 text-xs text-muted truncate">{nama}</p>
      )}
    </aside>
  );
}
