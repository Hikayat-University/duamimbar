"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_proyek: "",
    deskripsi: "",
    divisi_terlibat: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/proyek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
      >
        + Tambah Proyek
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
      >
        <h2 className="font-display text-lg text-denim-700">Proyek Baru</h2>
        <input
          required
          placeholder="Nama proyek"
          value={form.nama_proyek}
          onChange={(e) => setForm({ ...form, nama_proyek: e.target.value })}
          className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
        />
        <textarea
          placeholder="Deskripsi singkat"
          value={form.deskripsi}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
          rows={3}
        />
        <input
          placeholder="Divisi terlibat (mis. SocMed, Finance)"
          value={form.divisi_terlibat}
          onChange={(e) => setForm({ ...form, divisi_terlibat: e.target.value })}
          className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={form.tanggal_mulai}
            onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
            className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
          />
          <input
            type="date"
            value={form.tanggal_selesai}
            onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
            className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
