"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Berjalan", "Selesai"];

type Proyek = {
  id_proyek: string;
  nama_proyek: string;
  deskripsi: string;
  divisi_terlibat: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dibuat_oleh: string;
};

const EMPTY_FORM = {
  nama_proyek: "",
  deskripsi: "",
  divisi_terlibat: "",
  status: "Berjalan",
  tanggal_mulai: "",
  tanggal_selesai: "",
};

export default function ProyekPerusahaanBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/proyek")
      .then((res) => res.json())
      .then(setList)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(p: Proyek) {
    setEditingId(p.id_proyek);
    setForm({
      nama_proyek: p.nama_proyek,
      deskripsi: p.deskripsi,
      divisi_terlibat: p.divisi_terlibat,
      status: p.status,
      tanggal_mulai: p.tanggal_mulai,
      tanggal_selesai: p.tanggal_selesai,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/proyek", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_proyek: editingId, ...form } : form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setFormOpen(false);
    load();
  }

  async function toggleSelesai(p: Proyek) {
    const newStatus = p.status === "Selesai" ? "Berjalan" : "Selesai";
    setList((prev) =>
      prev.map((row) => (row.id_proyek === p.id_proyek ? { ...row, status: newStatus } : row))
    );
    await fetch("/api/proyek", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek: p.id_proyek, status: newStatus }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus proyek ini? Data terkait di dashboard lain tidak ikut terhapus.")) return;
    await fetch("/api/proyek", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek: id }),
    });
    load();
  }

  if (loading) return <p className="text-muted text-sm">Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-denim-700">Proyek Perusahaan</h1>
          <p className="text-muted text-sm mt-0.5">
            Semua proyek yang sedang berjalan di seluruh tim.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openNew}
            className="text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
          >
            + Tambah Proyek
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-muted text-sm">
          Belum ada proyek yang tercatat. {canEdit && "Tambahkan proyek pertama di atas."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <Card key={p.id_proyek}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-denim-900">{p.nama_proyek}</h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-2">{p.deskripsi}</p>
              <p className="text-xs text-muted font-mono">{p.divisi_terlibat}</p>
              {canEdit && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-denim-100">
                  <button
                    onClick={() => toggleSelesai(p)}
                    className="text-xs text-gold-500 underline"
                  >
                    Tandai {p.status === "Selesai" ? "Berjalan" : "Selesai"}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id_proyek)}
                    className="text-xs text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">
              {editingId ? "Edit Proyek" : "Proyek Baru"}
            </h2>
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
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
