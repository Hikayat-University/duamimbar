"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const TYPE_OPTIONS = ["On-the-Spot", "Bulanan", "Project"];

type BudgetRequestRow = {
  rowIndex: number;
  "Request ID": string;
  Date: string;
  "Requested By": string;
  Division: string;
  Type: string;
  Program: string;
  "Account Code": string;
  "Amount (Rp)": string;
  Description: string;
  Status: string;
  "Approval Note": string;
  "Approved By": string;
  "Approval Date": string;
  budgetWarning: string | null;
};

type Master = {
  program: { "Program ID": string; Name: string }[];
  coa: { "Account Code": string; "Account Name": string; Class: string }[];
};

const EMPTY_FORM = {
  Type: "On-the-Spot",
  Program: "",
  "Account Code": "",
  "Amount (Rp)": "",
  Description: "",
};

export default function BudgetRequestBoard({ role }: { role: string }) {
  const [rows, setRows] = useState<BudgetRequestRow[]>([]);
  const [threshold, setThreshold] = useState(5_000_000);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const isRequester = role === "kadiv_socmed" || role === "kadiv_business";
  const isFinance = role === "kadiv_finance";
  const isHeadDirector = role === "head_director";

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/finance/budget-requests").then((r) => r.json()),
      fetch("/api/finance/master").then((r) => r.json()),
    ]).then(([reqResult, masterResult]) => {
      if (reqResult.status === "fulfilled" && !reqResult.value.error) {
        setRows(reqResult.value.rows);
        setThreshold(reqResult.value.threshold);
      }
      if (masterResult.status === "fulfilled") setMaster(masterResult.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/budget-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mengajukan.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setFormOpen(false);
    load();
  }

  async function handleAction(row: BudgetRequestRow, action: "approve" | "reject") {
    if (action === "reject" && !confirm(`Tolak pengajuan ${row["Request ID"]}?`)) return;
    setBusyIndex(row.rowIndex);
    const res = await fetch("/api/finance/budget-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: row.rowIndex, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error ?? "Gagal memproses.");
    setBusyIndex(null);
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {isRequester && (
        <button
          onClick={openNew}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          + Ajukan Anggaran
        </button>
      )}

      {(isFinance || isHeadDirector) && (
        <p className="text-xs text-muted mb-4">
          Pengajuan ≥ Rp {threshold.toLocaleString("id-ID")} butuh persetujuan tambahan dari Head
          Director setelah disetujui kadiv_finance. Setelah disetujui, transaksinya tetap perlu
          diinput manual di tab Transactions oleh kadiv_finance.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Belum ada pengajuan anggaran.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const canFinanceAct = isFinance && r.Status === "Pending";
            const canHeadDirectorAct = isHeadDirector && r.Status === "Menunggu Head Director";
            const busy = busyIndex === r.rowIndex;

            return (
              <Card key={r.rowIndex}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-medium text-denim-900 text-sm">{r.Description}</p>
                    <p className="text-xs text-muted font-mono">
                      {r["Request ID"]} · {r.Date} · {r["Requested By"]} ({r.Division})
                    </p>
                  </div>
                  <StatusBadge status={r.Status} />
                </div>
                <p className="text-sm text-denim-900 font-mono mb-1">
                  Rp {Number(r["Amount (Rp)"] || 0).toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted">
                  {r.Type} · {r.Program} · {r["Account Code"]}
                </p>
                {r["Approved By"] && (
                  <p className="text-xs text-muted mt-1">
                    {r.Status === "Rejected" ? "Ditolak" : "Diproses"} oleh {r["Approved By"]} ·{" "}
                    {r["Approval Date"]}
                  </p>
                )}
                {r.budgetWarning && (
                  <p className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2.5 py-1.5 mt-2">
                    ⚠ {r.budgetWarning}
                  </p>
                )}
                {(canFinanceAct || canHeadDirectorAct) && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-denim-100">
                    <button
                      onClick={() => handleAction(r, "approve")}
                      disabled={busy}
                      className="text-xs bg-denim-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {canHeadDirectorAct ? "Setujui (Head Director)" : "Setujui"}
                    </button>
                    <button
                      onClick={() => handleAction(r, "reject")}
                      disabled={busy}
                      className="text-xs text-red-600 underline"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {formOpen && master && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8"
          >
            <h2 className="font-display text-lg text-denim-700">Ajukan Anggaran</h2>

            <select
              value={form.Type}
              onChange={(e) => setForm({ ...form, Type: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              required
              value={form.Program}
              onChange={(e) => setForm({ ...form, Program: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Program</option>
              {master.program.map((p) => (
                <option key={p["Program ID"]} value={p.Name}>{p.Name}</option>
              ))}
            </select>

            <select
              required
              value={form["Account Code"]}
              onChange={(e) => setForm({ ...form, "Account Code": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Account Code</option>
              {master.coa
                .filter((c) => c.Class === "Direct Cost" || c.Class === "Operating Expense")
                .map((c) => (
                  <option key={c["Account Code"]} value={c["Account Code"]}>
                    {c["Account Code"]} — {c["Account Name"]}
                  </option>
                ))}
            </select>

            <input
              required
              type="number"
              placeholder="Nominal (Rp)"
              value={form["Amount (Rp)"]}
              onChange={(e) => setForm({ ...form, "Amount (Rp)": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              required
              placeholder="Deskripsi/keperluan"
              value={form.Description}
              onChange={(e) => setForm({ ...form, Description: e.target.value })}
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
                {saving ? "Mengajukan..." : "Ajukan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
