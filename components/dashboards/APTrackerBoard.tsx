"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Open", "Paid", "Overdue"];
const APPROVAL_OPTIONS = ["Pending", "Approved", "Rejected"];

type ApRow = {
  rowIndex: number;
  Vendor: string;
  "Bill/Reference": string;
  Program: string;
  Category: string;
  "Due Date": string;
  "Amount (Rp)": string;
  Approval: string;
  "Payment Date": string;
  Status: string;
};

type Master = {
  program: { "Program ID": string; Name: string }[];
  vendor: { "Vendor ID": string; "Vendor Name": string; Category: string }[];
};

const EMPTY_FORM = {
  Vendor: "",
  "Bill/Reference": "",
  Program: "",
  Category: "",
  "Due Date": "",
  "Amount (Rp)": "",
  Approval: "Pending",
  "Payment Date": "",
  Status: "Open",
};

export default function APTrackerBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<ApRow[]>([]);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/finance/ap").then((r) => r.json()),
      fetch("/api/finance/master").then((r) => r.json()),
    ]).then(([apResult, masterResult]) => {
      if (apResult.status === "fulfilled") setList(apResult.value);
      if (masterResult.status === "fulfilled") setMaster(masterResult.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/ap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function updateField(row: ApRow, updates: Partial<ApRow>) {
    setUpdatingIndex(row.rowIndex);
    setList((prev) => prev.map((r) => (r.rowIndex === row.rowIndex ? { ...r, ...updates } : r)));
    await fetch("/api/finance/ap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: row.rowIndex, ...updates }),
    });
    setUpdatingIndex(null);
  }

  async function handleDelete(rowIndex: number) {
    if (!confirm("Hapus catatan utang ini?")) return;
    await fetch("/api/finance/ap", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex }),
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
          + Tambah Utang
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada utang tercatat.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.rowIndex}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{r.Vendor}</p>
                  <p className="text-xs text-muted font-mono">
                    {r["Bill/Reference"]} · Jatuh tempo {r["Due Date"]}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <StatusBadge status={r.Approval} />
                  <StatusBadge status={r.Status} />
                </div>
              </div>
              <p className="text-sm text-denim-900 font-mono mb-1">
                Rp {Number(r["Amount (Rp)"] || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted">{r.Category}</p>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-denim-100">
                  <select
                    value={r.Approval}
                    onChange={(e) => updateField(r, { Approval: e.target.value })}
                    disabled={updatingIndex === r.rowIndex}
                    className="text-xs rounded-lg border border-denim-100 px-2 py-1 outline-none focus:border-denim-500 bg-white disabled:opacity-50"
                  >
                    {APPROVAL_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={r.Status}
                    onChange={(e) => updateField(r, { Status: e.target.value })}
                    disabled={updatingIndex === r.rowIndex}
                    className="text-xs rounded-lg border border-denim-100 px-2 py-1 outline-none focus:border-denim-500 bg-white disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(r.rowIndex)}
                    className="text-xs text-red-600 underline ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {formOpen && master && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8"
          >
            <h2 className="font-display text-lg text-denim-700">Utang Baru</h2>

            <select
              required
              value={form.Vendor}
              onChange={(e) => {
                const vendor = master.vendor.find((v) => v["Vendor Name"] === e.target.value);
                setForm({ ...form, Vendor: e.target.value, Category: vendor?.Category ?? form.Category });
              }}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Vendor</option>
              {master.vendor.map((v) => (
                <option key={v["Vendor ID"]} value={v["Vendor Name"]}>{v["Vendor Name"]}</option>
              ))}
            </select>

            <input
              required
              placeholder="Bill/Reference"
              value={form["Bill/Reference"]}
              onChange={(e) => setForm({ ...form, "Bill/Reference": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <select
              value={form.Program}
              onChange={(e) => setForm({ ...form, Program: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Program (opsional)</option>
              {master.program.map((p) => (
                <option key={p["Program ID"]} value={p.Name}>{p.Name}</option>
              ))}
            </select>

            <input
              placeholder="Kategori"
              value={form.Category}
              onChange={(e) => setForm({ ...form, Category: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <label className="text-xs text-muted block -mb-2">Jatuh tempo</label>
            <input
              required
              type="date"
              value={form["Due Date"]}
              onChange={(e) => setForm({ ...form, "Due Date": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              type="number"
              placeholder="Nominal (Rp)"
              value={form["Amount (Rp)"]}
              onChange={(e) => setForm({ ...form, "Amount (Rp)": e.target.value })}
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
