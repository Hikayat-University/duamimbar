"use client";

import { ReactNode } from "react";

export default function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-30 flex items-end bg-denim-ink/45"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[82%] w-full animate-[slideUp_0.18s_ease] overflow-y-auto rounded-t-sheet bg-white p-5 pb-8">
        <div className="relative">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-denim-pale text-denim"
          >
            ✕
          </button>
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
          {children}
        </div>
      </div>
    </div>
  );
}
