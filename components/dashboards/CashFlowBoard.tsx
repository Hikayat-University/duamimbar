"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const TIPE_OPTIONS = ["Masuk", "Keluar"];

type Transaksi = {
  id_transaksi: string;
  tanggal: string;
  tipe: string;
  kategori: string;
  nominal: string;
  keterangan: string;
  input_oleh: string;
};

const EMPTY_FORM = { tanggal: "", tipe: "Masuk", kategori: "", nominal: "", keterangan: "" };

export default function CashFlowBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/finance/cashflow")
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

  function openEdit(t: Transaksi) {
    setEditingId(t.id_transaksi);
    setForm({
      tanggal: t.tanggal,
      tipe: t.tipe,
      kategori: t.kategori,
      nominal: t.nominal,
      keterangan: t.keterangan,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/cashflow", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_transaksi: editingId, ...form } : form),
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
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch("/api/finance/cashflow", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_transaksi: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  const totalMasuk = list
    .filter((t) => t.tipe === "Masuk")
    .reduce((sum, t) => sum + (parseFloat(t.nominal.replace(/[^0-9.-]/g, "")) || 0), 0);
  const totalKeluar = list
    .filter((t) => t.tipe === "Keluar")
    .reduce((sum, t) => sum + (parseFloat(t.nominal.replace(/[^0-9.-]/g, "")) || 0), 0);

  return (
    <div>
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <p className="text-xs text-muted mb-1">Total Masuk</p>
            <p className="font-display text-lg text-denim-700">
              Rp {totalMasuk.toLocaleString("id-ID")}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted mb-1">Total Keluar</p>
            <p className="font-display text-lg text-denim-700">
              Rp {totalKeluar.toLocaleString("id-ID")}
            </p>
          </Card>
        </div>
      )}

      {canEdit && (
        <button
          onClick={openNew}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          + Tambah Transaksi
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada transaksi tercatat.</p>
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id_transaksi}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{t.kategori}</p>
                  <p className="text-xs text-muted font-mono">
                    {t.tanggal} · input: {t.input_oleh}
                  </p>
                </div>
                <StatusBadge status={t.tipe} />
              </div>
              <p className="text-sm text-denim-900 font-mono mb-1">{t.nominal}</p>
              {t.keterangan && <p className="text-sm text-muted mb-2">{t.keterangan}</p>}
              {canEdit && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button onClick={() => openEdit(t)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id_transaksi)}
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
              placeholder="Kategori (mis. Klien - Brand X)"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              placeholder="Nominal (mis. Rp 1.500.000)"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              placeholder="Keterangan (opsional)"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
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
