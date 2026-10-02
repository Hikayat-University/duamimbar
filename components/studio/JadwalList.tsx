"use client";

import { useState } from "react";
import { MapPin, Users } from "lucide-react";
import { type Jadwal, STATUS_JADWAL, TAHAP_JADWAL, WARNA_TAHAP, formatTanggal, labelDari } from "@/lib/produksi";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "./ui";
import JadwalForm, { type ProyekOpsi } from "./JadwalForm";

export default function JadwalList({
  jadwal,
  proyek,
  kosong = "Belum ada jadwal.",
  tampilkanProyek = true,
}: {
  jadwal: Jadwal[];
  proyek: ProyekOpsi[];
  kosong?: string;
  tampilkanProyek?: boolean;
}) {
  const [edit, setEdit] = useState<Jadwal | null>(null);
  const namaProyek = new Map(proyek.map((p) => [p.id, p.nama]));

  if (jadwal.length === 0) return <EmptyState message={kosong} />;

  return (
    <>
      <ul className="divide-y divide-denim-100 overflow-hidden rounded-2xl border border-denim-100 bg-white">
        {jadwal.map((j) => (
          <li key={j.id}>
            <button onClick={() => setEdit(j)} className="flex w-full gap-4 px-4 py-3.5 text-left hover:bg-surface">
              <div className="w-14 shrink-0 text-center">
                <p className="font-mono text-lg leading-none text-denim-900">
                  {formatTanggal(j.tanggal, { day: "numeric", month: undefined, year: undefined })}
                </p>
                <p className="mt-1 text-[11px] uppercase text-muted">
                  {formatTanggal(j.tanggal, { day: undefined, month: "short", year: undefined, weekday: "short" })}
                </p>
              </div>
              <span className={`mt-1 w-1 shrink-0 self-stretch rounded-full ${WARNA_TAHAP[j.tahap]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-denim-900 ${j.status === "selesai" ? "line-through opacity-60" : ""}`}>
                    {j.judul}
                  </p>
                  <Badge nilai={j.status} label={labelDari(STATUS_JADWAL, j.status)} />
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {labelDari(TAHAP_JADWAL, j.tahap)}
                  {j.jam ? ` · ${j.jam}` : ""}
                  {j.tanggal_akhir && j.tanggal_akhir !== j.tanggal ? ` · s.d. ${formatTanggal(j.tanggal_akhir)}` : ""}
                  {tampilkanProyek && j.proyek_id && namaProyek.has(j.proyek_id) ? ` · ${namaProyek.get(j.proyek_id)}` : ""}
                </p>
                {(j.lokasi || j.kru) && (
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {j.lokasi && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {j.lokasi}
                      </span>
                    )}
                    {j.kru && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} /> {j.kru}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {edit && <JadwalForm awal={edit} proyek={proyek} onClose={() => setEdit(null)} />}
    </>
  );
}

