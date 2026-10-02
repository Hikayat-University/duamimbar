"use client";

import { useMemo, useState } from "react";
import type { Karya } from "@/lib/produksi";
import KaryaCard from "./KaryaCard";

export default function KaryaGallery({ karya }: { karya: Karya[] }) {
  const kategori = useMemo(() => Array.from(new Set(karya.map((k) => k.kategori))), [karya]);
  const [aktif, setAktif] = useState<string | null>(null);
  const tampil = aktif ? karya.filter((k) => k.kategori === aktif) : karya;

  return (
    <div>
      {kategori.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {[null, ...kategori].map((k) => (
            <button
              key={k ?? "semua"}
              onClick={() => setAktif(k)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                aktif === k ? "bg-denim-900 text-white" : "bg-white text-denim-700 ring-1 ring-denim-100 hover:ring-denim-300"
              }`}
            >
              {k ?? "Semua"}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {tampil.map((k) => (
          <KaryaCard key={k.id} karya={k} />
        ))}
      </div>
    </div>
  );
}
