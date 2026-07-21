"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const TIPE_OPTIONS = ["Revenue", "Cost"];
const SETOR_OPTIONS = ["Belum", "Sudah"];

type Flow = {
  id_flow: string;
  id_bisnis: string;
  tanggal: string;
  tipe: string;
  nominal: string;
  keterangan: string;
  status_setor_ke_finance: string;
  catatan_finance: string;
};

type Bisnis = { id_bisnis: string; nama_bisnis: string };

const EMPTY_FORM = {
  id_bisnis: "",
  tanggal: "",
  tipe: "Revenue",
  nominal: "",
  keterangan: "",
  status_setor_ke_finance: "Belum",
};

export default function BusinessFlowBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Flow[]>([]);
  const [bisnisList, setBisnisList] = useState<Bisnis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/business/flow").then((res) => res.json()),
      fetch("/api/business/overview").then((res) => res.json()),
    ])
      .then(([flow, bisnis]) => {
        setList(flow);
        setBisnisList(bisnis);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function namaBisnis(id: string) {
    return bisnisList.find((b) => b.id_bisnis === id)?.nama_bisnis ?? "(bisnis tidak dikenal)";
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id_bisnis: bisnisList[0]?.id_bisnis ?? "" });
    setFormOpen(true);
  }

  function openEdit(f: Flow) {
    setEditingId(f.id_flow);
    setForm({
      id_bisnis: f.id_bisnis,
      tanggal: f.tanggal,
      tipe: f.tipe,
      nominal: f.nominal,
      keterangan: f.keterangan,
      status_setor_ke_finance: f.status_setor_ke_finance,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/business/flow", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_flow: editingId, ...form } : form),
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
    if (!confirm("Hapus catatan ini?")) return;
    await fetch("/api/business/flow", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_flow: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          disabled={bisnisList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Tambah Transaksi
        </button>
      )}
      {canEdit && bisnisList.length === 0 && (
        <p className="text-xs text-muted mb-4">
          Tambahkan lini bisnis dulu di tab Business Overview sebelum bisa mencatat transaksi.
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada data revenue/cost.</p>
      ) : (
        <div className="space-y-3">
          {list.map((f) => (
            <Card key={f.id_flow}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{namaBisnis(f.id_bisnis)}</p>
                  <p className="text-xs text-muted font-mono">{f.tanggal}</p>
                </div>
                <div className="flex gap-1.5">
                  <StatusBadge status={f.tipe} />
                  <StatusBadge status={f.status_setor_ke_finance} />
                </div>
              </div>
              <p className="text-sm text-denim-900 font-mono mb-1">{f.nominal}</p>
              {f.keterangan && <p className="text-sm text-muted mb-2">{f.keterangan}</p>}
              {f.catatan_finance && (
                <p className="text-xs text-gold-500 mb-2">
                  Catatan Finance: {f.catatan_finance}
                </p>
              )}
              {canEdit && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button onClick={() => openEdit(f)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(f.id_flow)}
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
              {editingId ? "Edit Transaksi" : "Transaksi Baru"}
            </h2>

            <select
              required
              value={form.id_bisnis}
              onChange={(e) => setForm({ ...form, id_bisnis: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {bisnisList.map((b) => (
                <option key={b.id_bisnis} value={b.id_bisnis}>
                  {b.nama_bisnis}
                </option>
              ))}
            </select>

            <input
              required
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

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
              placeholder="Nominal (mis. Rp 1.500.000)"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              placeholder="Keterangan"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={2}
            />

            <div>
              <label className="text-xs text-muted mb-1 block">Sudah disetor ke Finance?</label>
              <select
                value={form.status_setor_ke_finance}
                onChange={(e) => setForm({ ...form, status_setor_ke_finance: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
              >
                {SETOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
