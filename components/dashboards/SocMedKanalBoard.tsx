"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Kanal = { id_kanal: string; nama_kanal: string; platform: string; link: string; dibuat_pada: string };
const EMPTY_FORM = { nama_kanal: "", platform: "", link: "" };

export default function SocMedKanalBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Kanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/socmed/kanal")
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

  function openEdit(k: Kanal) {
    setEditingId(k.id_kanal);
    setForm({ nama_kanal: k.nama_kanal, platform: k.platform, link: k.link });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/socmed/kanal", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_kanal: editingId, ...form } : form),
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
    if (!confirm("Hapus kanal ini? Konten yang terhubung tidak ikut terhapus otomatis.")) return;
    await fetch("/api/socmed/kanal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_kanal: id }),
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
          + Tambah Kanal
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada kanal yang digarap.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((k) => (
            <Card key={k.id_kanal}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-denim-900">{k.nama_kanal}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-denim-50 text-denim-700">
                  {k.platform}
                </span>
              </div>
              {k.link && (
                <a
                  href={k.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-denim-500 underline"
                >
                  Buka kanal
                </a>
              )}
              {canEdit && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-denim-100">
                  <button onClick={() => openEdit(k)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(k.id_kanal)}
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
              {editingId ? "Edit Kanal" : "Kanal Baru"}
            </h2>
            <input
              required
              placeholder="Nama kanal (mis. Instagram Duamimbar)"
              value={form.nama_kanal}
              onChange={(e) => setForm({ ...form, nama_kanal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />
            <input
              required
              placeholder="Platform (mis. Instagram, TikTok, YouTube)"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />
            <input
              placeholder="Link (opsional)"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

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
