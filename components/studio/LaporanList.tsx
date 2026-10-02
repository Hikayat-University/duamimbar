"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { type Laporan, formatTanggal } from "@/lib/produksi";
import { EmptyState } from "@/components/ui/EmptyState";
import LaporanForm from "./LaporanForm";
import type { ProyekOpsi } from "./JadwalForm";

function Bagian({ judul, isi }: { judul: string; isi: string | null }) {
  if (!isi) return null;
  return (
    <div>
      <p className="text-xs text-muted">{judul}</p>
      <p className="whitespace-pre-line text-sm text-denim-900">{isi}</p>
    </div>
  );
}

export default function LaporanList({
  laporan,
  proyek,
  kosong = "Belum ada laporan.",
  tampilkanProyek = true,
}: {
  laporan: Laporan[];
  proyek: ProyekOpsi[];
  kosong?: string;
  tampilkanProyek?: boolean;
}) {
  const [edit, setEdit] = useState<Laporan | null>(null);
  const namaProyek = new Map(proyek.map((p) => [p.id, p.nama]));

  if (laporan.length === 0) return <EmptyState message={kosong} />;

  // Kelompokkan per tanggal (data sudah urut terbaru dulu dari query).
  const grup: [string, Laporan[]][] = [];
  for (const l of laporan) {
    const last = grup[grup.length - 1];
    if (last && last[0] === l.tanggal) last[1].push(l);
    else grup.push([l.tanggal, [l]]);
  }

  return (
    <>
      <div className="space-y-6">
        {grup.map(([tanggal, items]) => (
          <section key={tanggal} className="break-inside-avoid">
            <h3 className="mb-2 text-sm font-medium text-denim-700">
              {formatTanggal(tanggal, { weekday: "long", month: "long" })}
            </h3>
            <div className="space-y-3">
              {items.map((l) => (
                <article key={l.id} className="group relative space-y-2 rounded-2xl border border-denim-100 bg-white p-4">
                  <button
                    onClick={() => setEdit(l)}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-surface print:hidden"
                    aria-label="Ubah laporan"
                  >
                    <Pencil size={14} />
                  </button>
                  {tampilkanProyek && (
                    <p className="pr-8 text-xs font-medium uppercase tracking-wide text-gold-500">
                      {(l.proyek_id && namaProyek.get(l.proyek_id)) || "Umum"}
                    </p>
                  )}
                  <Bagian judul="Dikerjakan" isi={l.dikerjakan} />
                  <Bagian judul="Hasil" isi={l.hasil} />
                  <Bagian judul="Kendala" isi={l.kendala} />
                  <Bagian judul="Rencana berikutnya" isi={l.rencana} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {edit && <LaporanForm awal={edit} proyek={proyek} onClose={() => setEdit(null)} />}
    </>
  );
}
