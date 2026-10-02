"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Laporan, hariIni } from "@/lib/produksi";
import { useSimpan } from "@/lib/useSimpan";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Label, Modal, PesanError } from "./ui";
import { type ProyekOpsi, opsiTerpilih } from "./JadwalForm";

const FIELD = ["tanggal", "proyek_id", "dikerjakan", "hasil", "kendala", "rencana"];

export default function LaporanForm({
  awal,
  proyek,
  bawaan = {},
  onClose,
}: {
  awal?: Laporan;
  proyek: ProyekOpsi[];
  bawaan?: Partial<Record<string, string>>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELD.map((k) => [k, String((awal as any)?.[k] ?? bawaan[k] ?? (k === "tanggal" ? hariIni() : ""))])
    )
  );
  const { jalankan, loading, error } = useSimpan();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()]));
    const supabase = createClient();
    const ok = await jalankan(() =>
      awal ? supabase.from("laporan").update(data).eq("id", awal.id) : supabase.from("laporan").insert(data)
    );
    if (ok) onClose();
  }

  async function hapus() {
    if (!awal || !confirm("Hapus laporan ini?")) return;
    const supabase = createClient();
    if (await jalankan(() => supabase.from("laporan").delete().eq("id", awal.id))) onClose();
  }

  return (
    <Modal judul={awal ? "Ubah laporan" : "Catat laporan"} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Label teks="Tanggal">
          <Input type="date" required value={form.tanggal} onChange={set("tanggal")} />
        </Label>
        <Label teks="Proyek">
          <Select value={form.proyek_id} onChange={set("proyek_id")}>
            <option value="">Umum / tanpa proyek</option>
            {opsiTerpilih(proyek, form.proyek_id).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </Label>
        <Label teks="Yang dikerjakan" className="col-span-2">
          <Textarea required rows={4} value={form.dikerjakan} onChange={set("dikerjakan")} placeholder="Satu kegiatan per baris" />
        </Label>
        <Label teks="Hasil / output" className="col-span-2">
          <Textarea rows={2} value={form.hasil} onChange={set("hasil")} placeholder="Mis. 2 episode selesai edit, link hasil render" />
        </Label>
        <Label teks="Kendala" className="col-span-2">
          <Textarea rows={2} value={form.kendala} onChange={set("kendala")} />
        </Label>
        <Label teks="Rencana berikutnya" className="col-span-2">
          <Textarea rows={2} value={form.rencana} onChange={set("rencana")} />
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
