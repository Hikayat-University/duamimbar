"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const TIPE_OPTIONS = ["Hutang", "Piutang"];

type Catatan = {
  id_catatan: string;
  tipe: string;
  pihak_terkait: string;
  nominal: string;
  jatuh_tempo: string;
  status: string;
  catatan: string;
};

const EMPTY_FORM = { tipe: "Hutang", pihak_terkait: "", nominal: "", jatuh_tempo: "", catatan: "" };

export default function HutangPiutangBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Catatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/finance/hutang")
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

  function openEdit(c: Catatan) {
    setEditingId(c.id_catatan);
    setForm({
      tipe: c.tipe,
      pihak_terkait: c.pihak_terkait,
      nominal: c.nominal,
      jatuh_tempo: c.jatuh_tempo,
      catatan: c.catatan,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/hutang", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_catatan: editingId, ...form } : form),
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

  async function toggleStatus(c: Catatan) {
    setTogglingId(c.id_catatan);
    const newStatus = c.status === "Lunas" ? "Belum" : "Lunas";
    setList((prev) =>
      prev.map((row) => (row.id_catatan === c.id_catatan ? { ...row, status: newStatus } : row))
    );
    await fetch("/api/finance/hutang", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_catatan: c.id_catatan, status: newStatus }),
    });
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus catatan ini?")) return;
    await fetch("/api/finance/hutang", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_catatan: id }),
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
          + Tambah Catatan
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada catatan hutang/piutang.</p>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <Card key={c.id_catatan}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{c.pihak_terkait}</p>
                  <p className="text-xs text-muted font-mono">Jatuh tempo: {c.jatuh_tempo}</p>
                </div>
                <div className="flex gap-1.5">
                  <StatusBadge status={c.tipe} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="text-sm text-denim-900 font-mono mb-1">{c.nominal}</p>
              {c.catatan && <p className="text-sm text-muted mb-2">{c.catatan}</p>}
              {canEdit && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button
                    onClick={() => toggleStatus(c)}
                    disabled={togglingId === c.id_catatan}
                    className="text-xs text-gold-500 underline disabled:opacity-50"
                  >
                    Tandai {c.status === "Lunas" ? "Belum Lunas" : "Lunas"}
                  </button>
                  <button onClick={() => openEdit(c)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id_catatan)}
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
              {editingId ? "Edit Catatan" : "Catatan Baru"}
            </h2>

            <select
              value={form.tipe}
              onChange={(e) => setForm({ ...form, tipe: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {TIPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              required
              placeholder="Pihak terkait"
              value={form.pihak_terkait}
              onChange={(e) => setForm({ ...form, pihak_terkait: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              placeholder="Nominal (mis. Rp 1.500.000)"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              type="date"
              value={form.jatuh_tempo}
              onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              placeholder="Catatan (opsional)"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={2}
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
