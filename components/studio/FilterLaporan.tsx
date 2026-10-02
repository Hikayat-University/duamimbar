"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import type { ProyekOpsi } from "./JadwalForm";

export default function FilterLaporan({
  bulan,
  proyekId,
  proyek,
}: {
  bulan: string;
  proyekId: string;
  proyek: ProyekOpsi[];
}) {
  const router = useRouter();

  function ke(b: string, p: string) {
    const q = new URLSearchParams();
    if (b) q.set("bulan", b);
    if (p) q.set("proyek", p);
    router.push(`/studio/laporan?${q}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
      <Input type="month" value={bulan} onChange={(e) => ke(e.target.value, proyekId)} className="!w-auto" aria-label="Bulan" />
      <Select value={proyekId} onChange={(e) => ke(bulan, e.target.value)} className="!w-auto max-w-[16rem]" aria-label="Proyek">
        <option value="">Semua proyek</option>
        {proyek.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}
          </option>
        ))}
      </Select>
      <Button variant="secondary" onClick={() => window.print()} className="ml-auto flex items-center gap-1.5">
        <Printer size={15} /> Cetak / PDF
      </Button>
    </div>
  );
}
