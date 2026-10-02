"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function PageHeader({
  judul,
  sub,
  aksi,
}: {
  judul: string;
  sub?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-denim-700">{judul}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {aksi && <div className="flex gap-2 print:hidden">{aksi}</div>}
    </div>
  );
}

export function Modal({
  judul,
  onClose,
  children,
}: {
  judul: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-denim-900/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-denim-700">{judul}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Label({ teks, children, className = "" }: { teks: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-muted">{teks}</span>
      {children}
    </label>
  );
}

const NADA: Record<string, string> = {
  ide: "bg-slate-100 text-slate-600",
  praproduksi: "bg-orange-50 text-orange-700",
  produksi: "bg-denim-50 text-denim-700",
  pascaproduksi: "bg-violet-50 text-violet-700",
  selesai: "bg-emerald-50 text-emerald-700",
  batal: "bg-red-50 text-red-600",
  terjadwal: "bg-denim-50 text-denim-700",
  berjalan: "bg-amber-50 text-amber-700",
  ditunda: "bg-red-50 text-red-600",
};

export function Badge({ nilai, label }: { nilai: string; label?: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${NADA[nilai] ?? "bg-surface text-muted"}`}>
      {label ?? nilai}
    </span>
  );
}

export function PesanError({ pesan }: { pesan: string | null }) {
  if (!pesan) return null;
  return <p className="text-sm text-red-600">{pesan}</p>;
}
