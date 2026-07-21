"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Perencanaan", "Berjalan", "Selesai"];

type Bisnis = {
  id_bisnis: string;
  nama_bisnis: string;
  deskripsi_singkat: string;
  bmc_link: string;
  status: string;
};

const EMPTY_FORM = {
  nama_bisnis: "",
  deskripsi_singkat: "",
  bmc_link: "",
  status: "Perencanaan",
};

export default function BusinessOverviewBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Bisnis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/business/overview")
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

  function openEdit(b: Bisnis) {
    setEditingId(b.id_bisnis);
    setForm({
      nama_bisnis: b.nama_bisnis,
      deskripsi_singkat: b.deskripsi_singkat,
      bmc_link: b.bmc_link,
      status: b.status,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/business/overview", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_bisnis: editingId, ...form } : form),
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

  async function handleDelete(id: string) {
    if (!confirm("Hapus lini bisnis ini? Data flow terkait tidak ikut terhapus otomatis.")) return;
    await fetch("/api/business/overview", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_bisnis: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          + Tambah Bisnis
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada lini bisnis tercatat.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((b) => (
            <Card key={b.id_bisnis}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-denim-900">{b.nama_bisnis}</h3>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-sm text-muted mb-2">{b.deskripsi_singkat}</p>
              {b.bmc_link && (
                <a
                  href={b.bmc_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-denim-500 underline"
                >
                  Lihat BMC
                </a>
              )}
              {canEdit && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-denim-100">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-xs text-denim-700 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id_bisnis)}
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
              {editingId ? "Edit Bisnis" : "Bisnis Baru"}
            </h2>

            <input
              required
              placeholder="Nama bisnis"
              value={form.nama_bisnis}
              onChange={(e) => setForm({ ...form, nama_bisnis: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />
            <textarea
              placeholder="Deskripsi singkat"
              value={form.deskripsi_singkat}
              onChange={(e) => setForm({ ...form, deskripsi_singkat: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={3}
            />
            <input
              placeholder="Link BMC (Google Doc/Slide, opsional)"
              value={form.bmc_link}
              onChange={(e) => setForm({ ...form, bmc_link: e.target.value })}
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
