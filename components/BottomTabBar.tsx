"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, CalendarDays, User } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const TAB_ITEMS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/my-project", label: "Project", icon: LayoutGrid },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
];

/**
 * Bottom tab bar — cuma nongol di HP (sm:hidden di sisi lawannya, Sidebar
 * yang hidden sm:flex). Sengaja dibatasin 5 icon (Home, My Project,
 * Kalender, Notif, Profile) biar nggak sesak di layar sempit — Kelola User
 * & Keluar dipindah ke dalam halaman Profile, bukan di sini.
 */
export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-denim-100 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-1 py-2">
        {TAB_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] ${
                active ? "text-denim-700" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-muted">
          <NotificationBell variant="bottombar" />
          <span>Notif</span>
        </div>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] ${
            pathname?.startsWith("/profile") ? "text-denim-700" : "text-muted"
          }`}
        >
          <User size={20} strokeWidth={pathname?.startsWith("/profile") ? 2.25 : 1.75} />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
