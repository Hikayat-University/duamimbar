"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { type Proyek, PROYEK_AKTIF, STATUS_PROYEK, formatTanggal, hariIni, labelDari } from "@/lib/produksi";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, PageHeader } from "./ui";
import ProyekForm from "./ProyekForm";

const FILTER = [
  { key: "aktif", label: "Berjalan", cocok: (p: Proyek) => PROYEK_AKTIF.includes(p.status) },
  { key: "ide", label: "Ide", cocok: (p: Proyek) => p.status === "ide" },
  { key: "selesai", label: "Selesai", cocok: (p: Proyek) => p.status === "selesai" },
  { key: "semua", label: "Semua", cocok: () => true },
];

export default function ProyekBoard({ proyek }: { proyek: Proyek[] }) {
  const [filter, setFilter] = useState("aktif");
  const [formBuka, setFormBuka] = useState(false);
  const f = FILTER.find((x) => x.key === filter)!;
  const tampil = proyek.filter(f.cocok);
  const today = hariIni();

  return (
    <>
      <PageHeader
        judul="Proyek"
        sub="Semua pekerjaan produksi, dari ide sampai selesai."
        aksi={
          <Button onClick={() => setFormBuka(true)} className="flex items-center gap-1.5">
            <Plus size={16} /> Proyek baru
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTER.map((x) => (
          <button
            key={x.key}
            onClick={() => setFilter(x.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              filter === x.key ? "bg-denim-900 text-white" : "bg-denim-50 text-denim-700 hover:bg-denim-100"
            }`}
          >
            {x.label} <span className="font-mono opacity-60">{proyek.filter(x.cocok).length}</span>
          </button>
        ))}
      </div>

      {tampil.length === 0 ? (
        <EmptyState message="Belum ada proyek di kelompok ini." />
      ) : (
        <ul className="divide-y divide-denim-100 overflow-hidden rounded-2xl border border-denim-100 bg-white">
          {tampil.map((p) => {
            const telat = p.tenggat && p.tenggat < today && PROYEK_AKTIF.includes(p.status);
            return (
              <li key={p.id}>
                <Link href={`/studio/proyek/${p.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-denim-900">{p.nama}</p>
                    <p className="truncate text-xs text-muted">
                      {[p.klien, p.jenis, p.pic && `PIC ${p.pic}`].filter(Boolean).join(" · ") || "Tanpa keterangan"}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className={`font-mono text-xs ${telat ? "text-red-600" : "text-muted"}`}>
                      {p.status === "selesai"
                        ? `Selesai ${formatTanggal(p.tanggal_selesai)}`
                        : p.tenggat
                          ? `${telat ? "Lewat tenggat" : "Tenggat"} ${formatTanggal(p.tenggat)}`
                          : ""}
                    </p>
                  </div>
                  <Badge nilai={p.status} label={labelDari(STATUS_PROYEK, p.status)} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {formBuka && <ProyekForm onClose={() => setFormBuka(false)} />}
    </>
  );
}
