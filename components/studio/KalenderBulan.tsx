"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Jadwal, TAHAP_JADWAL, WARNA_TAHAP, hariIni, tambahHari } from "@/lib/produksi";
import JadwalForm, { type ProyekOpsi } from "./JadwalForm";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function geserBulan(bulan: string, n: number) {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export default function KalenderBulan({
  bulan,
  jadwal,
  proyek,
}: {
  bulan: string; // YYYY-MM
  jadwal: Jadwal[];
  proyek: ProyekOpsi[];
}) {
  const [edit, setEdit] = useState<Jadwal | null>(null);
  const [baru, setBaru] = useState<string | null>(null);
  const today = hariIni();

  const awal = `${bulan}-01`;
  const offset = (new Date(`${awal}T00:00:00Z`).getUTCDay() + 6) % 7; // Senin = 0
  const mulaiGrid = tambahHari(awal, -offset);
  const jumlahHari = new Date(Date.UTC(Number(bulan.slice(0, 4)), Number(bulan.slice(5, 7)), 0)).getUTCDate();
  const jumlahSel = Math.ceil((offset + jumlahHari) / 7) * 7;
  const sel = Array.from({ length: jumlahSel }, (_, i) => tambahHari(mulaiGrid, i));

  const perHari = (tgl: string) =>
    jadwal.filter((j) => j.tanggal <= tgl && (j.tanggal_akhir ?? j.tanggal) >= tgl);

  const judulBulan = new Date(`${awal}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-denim-100 bg-white">
      <div className="flex items-center justify-between border-b border-denim-100 px-4 py-3">
        <h2 className="font-display text-denim-700">{judulBulan}</h2>
        <div className="flex items-center gap-1">
          <Link href={`/studio/jadwal?bulan=${geserBulan(bulan, -1)}`} className="rounded-lg p-1.5 hover:bg-surface" aria-label="Bulan sebelumnya">
            <ChevronLeft size={18} />
          </Link>
          <Link href="/studio/jadwal" className="rounded-lg px-2 py-1 text-xs text-denim-500 hover:bg-surface">
            Hari ini
          </Link>
          <Link href={`/studio/jadwal?bulan=${geserBulan(bulan, 1)}`} className="rounded-lg p-1.5 hover:bg-surface" aria-label="Bulan berikutnya">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-denim-100 text-center text-[11px] uppercase text-muted">
        {HARI.map((h) => (
          <div key={h} className="py-2">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {sel.map((tgl, i) => {
          const items = perHari(tgl);
          const diLuar = !tgl.startsWith(bulan);
          return (
            <div
              key={tgl}
              onClick={() => setBaru(tgl)}
              className={`min-h-[76px] cursor-pointer border-denim-100 p-1 hover:bg-surface sm:min-h-[104px] sm:p-1.5 ${
                i % 7 !== 6 ? "border-r" : ""
              } ${i < jumlahSel - 7 ? "border-b" : ""} ${diLuar ? "bg-surface/60" : ""}`}
            >
              <p
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${
                  tgl === today ? "bg-denim-700 text-white" : diLuar ? "text-denim-300" : "text-denim-900"
                }`}
              >
                {Number(tgl.slice(8))}
              </p>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((j) => (
                  <button
                    key={j.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEdit(j);
                    }}
                    title={j.judul}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight text-white sm:text-[11px] ${
                      WARNA_TAHAP[j.tahap]
                    } ${j.status === "selesai" ? "opacity-50" : ""}`}
                  >
                    {j.judul}
                  </button>
                ))}
                {items.length > 3 && <p className="px-1 text-[10px] text-muted">+{items.length - 3} lagi</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-denim-100 px-4 py-3 text-xs text-muted">
        {TAHAP_JADWAL.map((t) => (
          <span key={t.value} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${WARNA_TAHAP[t.value]}`} /> {t.label}
          </span>
        ))}
      </div>

      {edit && <JadwalForm awal={edit} proyek={proyek} onClose={() => setEdit(null)} />}
      {baru && <JadwalForm proyek={proyek} bawaan={{ tanggal: baru }} onClose={() => setBaru(null)} />}
    </div>
  );
}
