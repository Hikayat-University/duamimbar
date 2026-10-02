"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Proyek, STATUS_PROYEK, hariIni } from "@/lib/produksi";
import { useSimpan } from "@/lib/useSimpan";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Label, Modal, PesanError } from "./ui";

const KOSONG = {
  nama: "",
  klien: "",
  jenis: "",
  status: "ide",
  tanggal_mulai: "",
  tenggat: "",
  tanggal_selesai: "",
  pic: "",
  catatan: "",
};

export default function ProyekForm({ awal, onClose }: { awal?: Proyek; onClose: () => void }) {
  const [form, setForm] = useState(() =>
    awal ? Object.fromEntries(Object.keys(KOSONG).map((k) => [k, (awal as any)[k] ?? ""])) : { ...KOSONG }
  );
  const { jalankan, loading, error } = useSimpan();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string | null> = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    );
    if (data.status === "selesai" && !data.tanggal_selesai) data.tanggal_selesai = hariIni();
    const supabase = createClient();
    const ok = await jalankan(() =>
      awal ? supabase.from("proyek").update(data).eq("id", awal.id) : supabase.from("proyek").insert(data)
    );
    if (ok) onClose();
  }

  return (
    <Modal judul={awal ? "Ubah proyek" : "Proyek baru"} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Label teks="Nama proyek" className="col-span-2">
          <Input required value={form.nama} onChange={set("nama")} placeholder="Mis. Video profil Yayasan X" />
        </Label>
        <Label teks="Klien / pemesan">
          <Input value={form.klien} onChange={set("klien")} placeholder="Internal" />
        </Label>
        <Label teks="Jenis produk">
          <Input value={form.jenis} onChange={set("jenis")} placeholder="Video, podcast, iklan..." />
        </Label>
        <Label teks="Status">
          <Select value={form.status} onChange={set("status")}>
            {STATUS_PROYEK.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label teks="PIC">
          <Input value={form.pic} onChange={set("pic")} />
        </Label>
        <Label teks="Mulai">
          <Input type="date" value={form.tanggal_mulai} onChange={set("tanggal_mulai")} />
        </Label>
        <Label teks="Tenggat">
          <Input type="date" value={form.tenggat} onChange={set("tenggat")} />
        </Label>
        {form.status === "selesai" && (
          <Label teks="Tanggal selesai" className="col-span-2">
            <Input type="date" value={form.tanggal_selesai} onChange={set("tanggal_selesai")} />
          </Label>
        )}
        <Label teks="Catatan / brief" className="col-span-2">
          <Textarea rows={4} value={form.catatan} onChange={set("catatan")} />
        </Label>
        <div className="col-span-2 space-y-3">
          <PesanError pesan={error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
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
