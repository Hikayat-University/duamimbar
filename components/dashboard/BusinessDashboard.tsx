"use client";

import { useState } from "react";
import Tabs from "@/components/Tabs";
import Card from "@/components/Card";
import Sheet from "@/components/Sheet";
import StatCard from "@/components/StatCard";
import { businesses } from "@/lib/data";
import { BusinessUnit } from "@/lib/types";

export default function BusinessDashboard() {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState<BusinessUnit | null>(null);

  return (
    <div>
      <Tabs
        items={[
          { key: "overview", label: "Business Overview" },
          { key: "flow", label: "Business Flow" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <div className="space-y-3">
          {businesses.map((b) => (
            <Card key={b.id} onClick={() => setSelected(b)}>
              <h3 className="text-[14.5px] font-semibold text-ink">{b.name}</h3>
              <div className="mt-1 text-[11.5px] text-muted">{b.desc}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <StatCard value="Rp 18jt" label="Revenue Bulan Ini" />
            <StatCard value="Rp 6jt" label="Cost Bulan Ini" />
          </div>
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-[12px] text-muted">
            Grafik tren revenue/cost per unit bisnis (placeholder)
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-wide text-denim-soft">
          Akses Tambahan
        </div>
        <div className="mb-3 rounded-lg bg-sand px-3 py-2.5 text-[11.5px] text-[#6B5B3E]">
          🔑 Akses khusus (view) ke <b>Budget Planner</b> milik Finance Manager.
        </div>
        <Card>
          <h3 className="text-[13.5px] font-semibold">→ Budget Planner</h3>
          <div className="text-[11px] text-muted">Anggaran tiap proyek</div>
        </Card>
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h2 className="font-display text-lg font-bold text-denim-ink">{selected.name}</h2>
            <div className="mt-3 text-[13.5px] leading-relaxed text-ink">{selected.desc}</div>
            <div className="mt-4 font-display text-[11px] font-bold uppercase tracking-wide text-denim-soft">
              Business Model Canvas
            </div>
            <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted">
              Placeholder BMC — 9 blok (Value Proposition, Customer Segments, dst.)
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-[11px] text-gold">
              Isi detail bisnis "dll" masih perlu dikonfirmasi.
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
