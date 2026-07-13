"use client";

import { useState } from "react";
import Tabs from "@/components/Tabs";
import Card from "@/components/Card";
import Sheet from "@/components/Sheet";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { channels } from "@/lib/data";
import { Channel } from "@/lib/types";

export default function SocialDashboard() {
  const [tab, setTab] = useState("channels");
  const [selected, setSelected] = useState<Channel | null>(null);

  return (
    <div>
      <Tabs
        items={[
          { key: "channels", label: "Channel Overview" },
          { key: "stats", label: "Performance Stats" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "channels" ? (
        <div className="space-y-3">
          {channels.map((c) => (
            <Card key={c.id} onClick={() => setSelected(c)}>
              <div className="flex items-center justify-between">
                <h3 className="text-[14.5px] font-semibold text-ink">{c.name}</h3>
                <span className="text-[11px] text-muted">{c.followers} followers</span>
              </div>
              <div className="mt-1 text-[11.5px] text-muted">
                Sudah {c.proyek.sudah} · Sedang {c.proyek.sedang} · Akan {c.proyek.akan}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-border py-2.5 text-[13px]">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-[11px] text-muted">Input terakhir: minggu lalu</div>
              </div>
              <Badge status="Rencana" />
            </div>
          ))}
          <button className="mt-4 w-full rounded-xl bg-denim py-2.5 text-sm font-semibold text-white">
            + Input Stats Minggu Ini
          </button>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-wide text-denim-soft">
          Akses Tambahan
        </div>
        <div className="mb-3 rounded-lg bg-sand px-3 py-2.5 text-[11.5px] text-[#6B5B3E]">
          🔑 Akses khusus ke <b>Video Editor Dashboard</b> (input proyek editor) &amp; <b>Business Overview</b>.
        </div>
        <div className="space-y-2.5">
          <Card>
            <h3 className="text-[13.5px] font-semibold">→ Video Editor Dashboard</h3>
            <div className="text-[11px] text-muted">Input proyek untuk tiap editor</div>
          </Card>
          <Card>
            <h3 className="text-[13.5px] font-semibold">→ Business Overview</h3>
            <div className="text-[11px] text-muted">Lihat unit bisnis perusahaan</div>
          </Card>
        </div>
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h2 className="font-display text-lg font-bold text-denim-ink">{selected.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <StatCard value={selected.followers} label="Followers" />
              <StatCard value={selected.engagement} label="Engagement" />
            </div>
            <div className="mt-5 space-y-4 text-[13px]">
              <div>
                <div className="mb-1 font-display text-[11px] font-bold uppercase text-denim-soft">
                  Sudah ({selected.proyek.sudah})
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span>Konten terjadwal {selected.name}</span>
                  <Badge status="Selesai" />
                </div>
              </div>
              <div>
                <div className="mb-1 font-display text-[11px] font-bold uppercase text-denim-soft">
                  Sedang Digarap ({selected.proyek.sedang})
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span>Produksi konten mingguan</span>
                  <Badge status="Berjalan" />
                </div>
              </div>
              <div>
                <div className="mb-1 font-display text-[11px] font-bold uppercase text-denim-soft">
                  Akan Digarap ({selected.proyek.akan})
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Rencana konten bulan depan</span>
                  <Badge status="Rencana" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
