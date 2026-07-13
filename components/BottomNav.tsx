"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/my-page", label: "My Page" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t border-border bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 font-display text-[10.5px] font-semibold ${
              active ? "bg-denim-pale text-denim" : "text-muted"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-md border-2 ${
                item.label === "My Page" ? "rounded-full" : ""
              }`}
              style={{ borderColor: "currentColor" }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
