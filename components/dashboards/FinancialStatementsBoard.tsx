"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

function formatRp(n: number) {
  const sign = n < 0 ? "-" : "";
  return sign + "Rp " + Math.abs(n).toLocaleString("id-ID");
}

type Statements = {
  period: { from: string; to: string };
  incomeStatement: { revenue: number; directCost: number; operatingExpense: number; netIncome: number };
  balanceSheet: {
    asOf: string;
    assets: number;
    liabilities: number;
    equityPosted: number;
    retainedEarningsComputed: number;
    totalEquity: number;
    isBalanced: boolean;
  };
  cashFlow: { operatingCf: number; investingCf: number; financingCf: number; netChange: number };
};

type GlLine = {
  journalId: string;
  date: string;
  source: string;
  sourceRef: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  runningBalance: number;
};

export default function FinancialStatementsBoard() {
  const [statements, setStatements] = useState<Statements | null>(null);
  const [gl, setGl] = useState<GlLine[] | null>(null);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGl, setShowGl] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetch(`/api/finance/statements?from=${from}&to=${to}`).then((r) => r.json()),
      fetch("/api/finance/gl").then((r) => r.json()),
    ]).then(([sRes, gRes]) => {
      if (sRes.status === "fulfilled") {
        if (sRes.value.error) setError(sRes.value.error);
        else setStatements(sRes.value);
      }
      if (gRes.status === "fulfilled" && !gRes.value.error) setGl(gRes.value.lines);
      setLoading(false);
    });
  }

  useEffect(load, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted block mb-1">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm rounded-lg border border-denim-100 px-2.5 py-1.5 outline-none focus:border-denim-500"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm rounded-lg border border-denim-100 px-2.5 py-1.5 outline-none focus:border-denim-500"
          />
        </div>
        <button
          onClick={load}
          className="text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          Terapkan
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Memuat...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : statements ? (
        <>
          <div>
            <p className="text-sm font-medium text-denim-900 mb-2">
              Income Statement ({statements.period.from} – {statements.period.to})
            </p>
            <Card>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Revenue</span>
                  <span className="font-mono text-emerald-700">{formatRp(statements.incomeStatement.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Direct Cost</span>
                  <span className="font-mono text-red-600">
                    ({formatRp(statements.incomeStatement.directCost)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Operating Expense</span>
                  <span className="font-mono text-red-600">
                    ({formatRp(statements.incomeStatement.operatingExpense)})
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-denim-100 font-medium">
                  <span className="text-denim-900">Net Income</span>
                  <span
                    className={`font-mono ${statements.incomeStatement.netIncome >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {formatRp(statements.incomeStatement.netIncome)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <p className="text-sm font-medium text-denim-900 mb-2">
              Balance Sheet (per {statements.balanceSheet.asOf})
            </p>
            <Card>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total Assets</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.balanceSheet.assets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Liabilities</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.balanceSheet.liabilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Equity (posted)</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.balanceSheet.equityPosted)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Retained Earnings (hitungan, belum ditutup)</span>
                  <span className="font-mono text-denim-900">
                    {formatRp(statements.balanceSheet.retainedEarningsComputed)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-denim-100 font-medium">
                  <span className="text-denim-900">Total Equity</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.balanceSheet.totalEquity)}</span>
                </div>
              </div>
              <p className={`text-xs mt-3 ${statements.balanceSheet.isBalanced ? "text-emerald-700" : "text-red-600"}`}>
                {statements.balanceSheet.isBalanced
                  ? "✓ Assets = Liabilities + Equity (balance)."
                  : "⚠ Assets ≠ Liabilities + Equity -- ada jurnal yang kemungkinan nggak lengkap/timpang, cek Journal Entries."}
              </p>
            </Card>
          </div>

          <div>
            <p className="text-sm font-medium text-denim-900 mb-2">
              Cash Flow Statement ({statements.period.from} – {statements.period.to})
            </p>
            <Card>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Operating</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.cashFlow.operatingCf)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Investing</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.cashFlow.investingCf)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Financing</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.cashFlow.financingCf)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-denim-100 font-medium">
                  <span className="text-denim-900">Net Change in Cash</span>
                  <span className="font-mono text-denim-900">{formatRp(statements.cashFlow.netChange)}</span>
                </div>
              </div>
              <p className="text-xs text-muted mt-3">
                Klasifikasi Investing/Financing disederhanakan dari akun lawan transaksi -- cek manual kalau ada
                jurnal non-standar.
              </p>
            </Card>
          </div>
        </>
      ) : null}

      <div>
        <button
          onClick={() => setShowGl((v) => !v)}
          className="text-sm text-denim-600 underline"
        >
          {showGl ? "Sembunyikan" : "Lihat"} General Ledger
        </button>

        {showGl && (
          <div className="mt-3 border border-denim-100 rounded-signature overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-denim-100 text-left text-xs text-denim-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Akun</th>
                    <th className="px-4 py-3 font-medium">Deskripsi</th>
                    <th className="px-4 py-3 font-medium">Debit</th>
                    <th className="px-4 py-3 font-medium">Kredit</th>
                    <th className="px-4 py-3 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(gl ?? []).map((l, i) => (
                    <tr key={i} className="border-t border-denim-50">
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{l.date}</td>
                      <td className="px-4 py-3 text-denim-900 whitespace-nowrap">
                        {l.accountCode} — {l.accountName}
                      </td>
                      <td className="px-4 py-3 text-muted">{l.description}</td>
                      <td className="px-4 py-3 font-mono text-muted">{l.debit ? l.debit.toLocaleString("id-ID") : ""}</td>
                      <td className="px-4 py-3 font-mono text-muted">{l.credit ? l.credit.toLocaleString("id-ID") : ""}</td>
                      <td className="px-4 py-3 font-mono text-denim-900">{l.runningBalance.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
