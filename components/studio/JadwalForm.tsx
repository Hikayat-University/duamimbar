"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Jadwal, STATUS_JADWAL, TAHAP_JADWAL, hariIni } from "@/lib/produksi";
import { useSimpan } from "@/lib/useSimpan";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Label, Modal, PesanError } from "./ui";

export type ProyekOpsi = { id: string; nama: string; status?: string };

/** Proyek yang selesai/batal disembunyikan dari pilihan, kecuali sedang terpilih. */
export function opsiTerpilih(proyek: ProyekOpsi[], terpilih: string) {
  return proyek.filter((p) => p.id === terpilih || !["selesai", "batal"].includes(p.status ?? ""));
}

const FIELD = ["judul", "proyek_id", "tahap", "tanggal", "tanggal_akhir", "jam", "lokasi", "kru", "status", "catatan"];

export default function JadwalForm({
  awal,
  proyek,
  bawaan = {},
  onClose,
}: {
  awal?: Jadwal;
  proyek: ProyekOpsi[];
  bawaan?: Partial<Record<string, string>>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELD.map((k) => [
        k,
        String(
          (awal as any)?.[k] ??
            bawaan[k] ??
            ({ tahap: "produksi", status: "terjadwal", tanggal: hariIni() } as Record<string, string>)[k] ??
            ""
        ),
      ])
    )
  );
  const { jalankan, loading, error, setError } = useSimpan();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.tanggal_akhir && form.tanggal_akhir < form.tanggal) {
      setError("Tanggal akhir tidak boleh sebelum tanggal mulai.");
      return;
    }
    const data = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()]));
    const supabase = createClient();
    const ok = await jalankan(() =>
      awal ? supabase.from("jadwal").update(data).eq("id", awal.id) : supabase.from("jadwal").insert(data)
    );
    if (ok) onClose();
  }

  async function hapus() {
    if (!awal || !confirm(`Hapus jadwal "${awal.judul}"?`)) return;
    const supabase = createClient();
    if (await jalankan(() => supabase.from("jadwal").delete().eq("id", awal.id))) onClose();
  }

  return (
    <Modal judul={awal ? "Ubah jadwal" : "Jadwal produksi baru"} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Label teks="Kegiatan" className="col-span-2">
          <Input required value={form.judul} onChange={set("judul")} placeholder="Mis. Shooting episode 3" />
        </Label>
        <Label teks="Proyek" className="col-span-2">
          <Select value={form.proyek_id} onChange={set("proyek_id")}>
            <option value="">Tanpa proyek</option>
            {opsiTerpilih(proyek, form.proyek_id).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </Label>
        <Label teks="Tahap">
          <Select value={form.tahap} onChange={set("tahap")}>
            {TAHAP_JADWAL.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label teks="Status">
          <Select value={form.status} onChange={set("status")}>
            {STATUS_JADWAL.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label teks="Tanggal">
          <Input type="date" required value={form.tanggal} onChange={set("tanggal")} />
        </Label>
        <Label teks="Sampai (opsional)">
          <Input type="date" value={form.tanggal_akhir} min={form.tanggal} onChange={set("tanggal_akhir")} />
        </Label>
        <Label teks="Jam">
          <Input value={form.jam} onChange={set("jam")} placeholder="08.00 - 15.00" />
        </Label>
        <Label teks="Lokasi">
          <Input value={form.lokasi} onChange={set("lokasi")} />
        </Label>
        <Label teks="Kru yang terlibat" className="col-span-2">
          <Input value={form.kru} onChange={set("kru")} placeholder="Nama-nama kru, pisahkan dengan koma" />
        </Label>
        <Label teks="Catatan" className="col-span-2">
          <Textarea rows={3} value={form.catatan} onChange={set("catatan")} placeholder="Peralatan, kebutuhan, kontak lokasi..." />
        </Label>
        <div className="col-span-2 space-y-3">
          <PesanError pesan={error} />
          <div className="flex items-center gap-2">
            {awal && (
              <Button type="button" variant="danger" onClick={hapus} disabled={loading}>
                Hapus
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} className="ml-auto">
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
