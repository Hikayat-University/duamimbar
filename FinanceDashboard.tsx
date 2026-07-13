"use client";

import { useState } from "react";
import Tabs from "@/components/Tabs";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import Sheet from "@/components/Sheet";
import { cashflow, debts, projects } from "@/lib/data";
import { Project } from "@/lib/types";

export default function FinanceDashboard() {
  const [tab, setTab] = useState("cashflow");
  const [selectedBudget, setSelectedBudget] = useState<Project | null>(null);

  return (
    <div>
      <Tabs
        items={[
          { key: "cashflow", label: "Cash Flow" },
          { key: "budget", label: "Budget Planner" },
          { key: "debt", label: "Hutang Piutang" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "cashflow" && (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <StatCard value="+Rp 36,8jt" label="Saldo Bulan Ini" />
            <StatCard value={`${cashflow.length}`} label="Transaksi Terbaru" />
          </div>
          <div className="space-y-0.5">
            {cashflow.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-border py-2.5 text-[13px]"
              >
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-[11px] text-muted">{c.date}</div>
                </div>
                <span
                  className={`font-semibold ${
                    c.type === "in" ? "text-ok" : "text-danger"
                  }`}
                >
                  {c.type === "in" ? "+" : "-"} {c.amount}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-[11px] text-gold">
            "Real-time" di sini masih perlu dikonfirmasi: input manual yang langsung tampil, atau
            sinkronisasi terjadwal dari Sheets/Excel (lihat PRD Bagian 9.2).
          </div>
        </div>
      )}

      {tab === "budget" && (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id} onClick={() => setSelectedBudget(p)}>
              <h3 className="text-[14.5px] font-semibold text-ink">{p.name}</h3>
              <div className="mt-1 text-[11.5px] text-muted">Klik untuk detail anggaran</div>
            </Card>
          ))}
          <div className="rounded-lg bg-sand px-3 py-2.5 text-[11.5px] text-[#6B5B3E]">
            🔑 Business Manager punya akses khusus (view) ke dashboard ini.
          </div>
        </div>
      )}

      {tab === "debt" && (
        <div className="space-y-0.5">
          {debts.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between border-b border-border py-2.5 text-[13px]"
            >
              <div>
                <div className="font-medium">{d.who}</div>
                <div className="text-[11px] text-muted">Jatuh tempo: {d.due}</div>
              </div>
              <Badge status={d.status} />
            </div>
          ))}
          <div className="mt-4 rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-[11px] text-gold">
            Field lengkap hutang-piutang masih perlu dikonfirmasi.
          </div>
        </div>
      )}

      <Sheet open={Boolean(selectedBudget)} onClose={() => setSelectedBudget(null)}>
        {selectedBudget && (
          <div>
            <h2 className="font-display text-lg font-bold text-denim-ink">
              Anggaran — {selectedBudget.name}
            </h2>
            <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted">
              Rincian anggaran (kategori, nominal, realisasi) — struktur data perlu dikonfirmasi.
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
