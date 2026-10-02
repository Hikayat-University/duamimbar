"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type Karya, thumbnailDari } from "@/lib/produksi";
import { useSimpan } from "@/lib/useSimpan";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, PesanError } from "./ui";
import KaryaForm from "./KaryaForm";

export default function PortofolioBoard({ karya }: { karya: Karya[] }) {
  const [edit, setEdit] = useState<Karya | "baru" | null>(null);
  const { jalankan, loading, error } = useSimpan();
  const terbit = karya.filter((k) => k.terbit).length;

  function toggle(k: Karya, kolom: "terbit" | "unggulan") {
    const supabase = createClient();
    jalankan(() => supabase.from("karya").update({ [kolom]: !k[kolom] }).eq("id", k.id));
  }

  return (
    <>
      <PageHeader
        judul="Portofolio"
        sub={`${terbit} dari ${karya.length} karya tampil di situs publik.`}
        aksi={
          <>
            <Link href="/" target="_blank" className="flex items-center gap-1.5 rounded-lg border border-denim-100 px-3.5 py-2 text-sm hover:border-denim-300">
              <ExternalLink size={15} /> Lihat situs
            </Link>
            <Button onClick={() => setEdit("baru")} className="flex items-center gap-1.5">
              <Plus size={16} /> Karya baru
            </Button>
          </>
        }
      />
      <PesanError pesan={error} />

      {karya.length === 0 ? (
        <EmptyState message="Belum ada karya. Tambahkan produk media pertama untuk ditampilkan di situs." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {karya.map((k) => {
            const thumb = thumbnailDari(k);
            return (
              <article key={k.id} className={`overflow-hidden rounded-2xl border border-denim-100 bg-white ${k.terbit ? "" : "opacity-70"}`}>
                <button onClick={() => setEdit(k)} className="block w-full text-left">
                  <div className="relative aspect-video bg-denim-50">
                    {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
                    {!k.terbit && (
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-muted">Draf</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate font-medium text-denim-900">{k.judul}</p>
                    <p className="truncate text-xs text-muted">
                      {[k.kategori, k.klien, k.tahun].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-denim-100 px-3 py-2 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={k.terbit} disabled={loading} onChange={() => toggle(k, "terbit")} />
                    Tampil
                  </label>
                  <button
                    onClick={() => toggle(k, "unggulan")}
                    disabled={loading}
                    className={`flex items-center gap-1 ${k.unggulan ? "text-gold-500" : "text-muted"}`}
                  >
                    <Star size={14} fill={k.unggulan ? "currentColor" : "none"} /> Pilihan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {edit && <KaryaForm awal={edit === "baru" ? undefined : edit} onClose={() => setEdit(null)} />}
    </>
  );
}
