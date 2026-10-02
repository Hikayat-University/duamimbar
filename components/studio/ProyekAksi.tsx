"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Proyek, STATUS_PROYEK, hariIni } from "@/lib/produksi";
import { useSimpan } from "@/lib/useSimpan";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormField";
import ProyekForm from "./ProyekForm";
import { PesanError } from "./ui";

/** Ganti status cepat, ubah, dan hapus proyek dari halaman detail. */
export default function ProyekAksi({ proyek }: { proyek: Proyek }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const { jalankan, loading, error } = useSimpan();
  const supabase = createClient();

  function gantiStatus(status: string) {
    const data: Record<string, string> = { status };
    if (status === "selesai" && !proyek.tanggal_selesai) {
      data.tanggal_selesai = hariIni();
    }
    jalankan(() => supabase.from("proyek").update(data).eq("id", proyek.id));
  }

  async function hapus() {
    if (!confirm(`Hapus proyek "${proyek.nama}"? Jadwalnya ikut terhapus, laporan tetap disimpan tanpa proyek.`)) return;
    if (await jalankan(() => supabase.from("proyek").delete().eq("id", proyek.id))) router.push("/studio/proyek");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={proyek.status}
          disabled={loading}
          onChange={(e) => gantiStatus(e.target.value)}
          className="!w-auto"
          aria-label="Status proyek"
        >
          {STATUS_PROYEK.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => setEdit(true)}>
          Ubah
        </Button>
        <Button variant="danger" onClick={hapus} disabled={loading} className="px-2">
          Hapus
        </Button>
      </div>
      <PesanError pesan={error} />
      {edit && <ProyekForm awal={proyek} onClose={() => setEdit(false)} />}
    </div>
  );
}
