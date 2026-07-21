"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Akan", "Sedang", "Sudah"];

type Konten = {
  id_konten: string;
  id_kanal: string;
  judul_konten: string;
  status: string;
  assigned_editor: string;
  tanggal_publish: string;
};
type Kanal = { id_kanal: string; nama_kanal: string };
type Editor = { id: string; nama: string };

const EMPTY_FORM = {
  id_kanal: "",
  judul_konten: "",
  status: "Akan",
  assigned_editor: "",
  tanggal_publish: "",
};

export default function SocMedKontenBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Konten[]>([]);
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [editorList, setEditorList] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
      fetch("/api/users/video-editors").then((res) => res.json()),
    ])
      .then(([konten, kanal, editors]) => {
        setList(konten);
        setKanalList(kanal);
        setEditorList(editors);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "(kanal tidak dikenal)";
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id_kanal: kanalList[0]?.id_kanal ?? "" });
    setFormOpen(true);
  }

  function openEdit(k: Konten) {
    setEditingId(k.id_konten);
    setForm({
      id_kanal: k.id_kanal,
      judul_konten: k.judul_konten,
      status: k.status,
      assigned_editor: k.assigned_editor,
      tanggal_publish: k.tanggal_publish,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/socmed/konten", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_konten: editingId, ...form } : form),
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
    if (!confirm("Hapus konten ini?")) return;
    await fetch("/api/socmed/konten", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_konten: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          disabled={kanalList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Tambah Konten
        </button>
      )}
      {canEdit && kanalList.length === 0 && (
        <p className="text-xs text-muted mb-4">
          Tambahkan kanal dulu di tab Kanal sebelum bisa bikin konten.
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada konten yang digarap.</p>
      ) : (
        <div className="space-y-3">
          {list.map((k) => (
            <Card key={k.id_konten}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{k.judul_konten}</p>
                  <p className="text-xs text-muted font-mono">{namaKanal(k.id_kanal)}</p>
                </div>
                <StatusBadge status={k.status} />
              </div>
              <p className="text-xs text-muted mb-2">
                Editor: {k.assigned_editor || "belum di-assign"}
                {k.tanggal_publish && ` · Publish: ${k.tanggal_publish}`}
              </p>
              {canEdit && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button onClick={() => openEdit(k)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(k.id_konten)}
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
              {editingId ? "Edit Konten" : "Konten Baru"}
            </h2>

            <select
              required
              value={form.id_kanal}
              onChange={(e) => setForm({ ...form, id_kanal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {kanalList.map((k) => (
                <option key={k.id_kanal} value={k.id_kanal}>
                  {k.nama_kanal}
                </option>
              ))}
            </select>

            <input
              required
              placeholder="Judul konten"
              value={form.judul_konten}
              onChange={(e) => setForm({ ...form, judul_konten: e.target.value })}
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

            <div>
              <label className="text-xs text-muted mb-1 block">
                Assign ke editor (opsional — otomatis muncul di dashboard editor terkait)
              </label>
              <select
                value={form.assigned_editor}
                onChange={(e) => setForm({ ...form, assigned_editor: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
              >
                <option value="">— Belum di-assign —</option>
                {editorList.map((ed) => (
                  <option key={ed.id} value={ed.nama}>
                    {ed.nama}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="date"
              placeholder="Tanggal publish"
              value={form.tanggal_publish}
              onChange={(e) => setForm({ ...form, tanggal_publish: e.target.value })}
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
