"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function waktuRelatif(iso: string) {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "barusan";
  if (detik < 3600) return `${Math.floor(detik / 60)}m lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)}j lalu`;
  return `${Math.floor(detik / 86400)}h lalu`;
}

export default function NotificationBell({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "bottombar";
}) {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  function load() {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setNotifs(data))
      .catch(() => {});
  }

  useEffect(() => {
    load();
    // Polling sederhana tiap 45 detik — cukup buat notifikasi assign
    // proyek yang nggak butuh real-time detik-per-detik.
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Badge angka merah di icon app (kayak WhatsApp) — cuma jalan kalau app
    // udah di-"Add to Home Screen" & browsernya dukung Badging API (Safari
    // iOS 16.4+, Chrome/Edge Android & desktop). Di browser biasa (tab web
    // normal) API ini nggak ada, jadi dibungkus pengecekan supaya aman.
    if (!("setAppBadge" in navigator)) return;
    if (unreadCount > 0) {
      (navigator as any).setAppBadge(unreadCount).catch(() => {});
    } else {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);

  async function handleNotifClick(n: Notif) {
    if (!n.is_read) {
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifikasi"
        className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-denim-900 transition-colors hover:bg-surface"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute w-80 max-h-96 overflow-y-auto rounded-2xl border border-denim-100 bg-white shadow-lg z-40 ${
            variant === "bottombar"
              ? "bottom-full right-0 mb-2"
              : "left-full bottom-0 ml-2"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-denim-100">
            <span className="text-sm font-medium text-denim-900">Notifikasi</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-denim-500 underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Belum ada notifikasi.</p>
          ) : (
            notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`block w-full text-left px-4 py-3 border-b border-denim-100 last:border-0 transition-colors hover:bg-surface ${
                  !n.is_read ? "bg-denim-50" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-denim-700 shrink-0" />}
                  <div className={!n.is_read ? "" : "pl-3.5"}>
                    <p className="text-sm font-medium text-denim-900">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted mt-1">{waktuRelatif(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
