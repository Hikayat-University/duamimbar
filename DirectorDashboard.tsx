"use client";

import { useState } from "react";
import Tabs from "@/components/Tabs";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Sheet from "@/components/Sheet";
import ProjectDetail from "@/components/ProjectDetail";
import { projects } from "@/lib/data";
import { Project } from "@/lib/types";

const divisionSummary = [
  { name: "Social Media Management", note: "3 kanal aktif · 2 proyek berjalan minggu ini" },
  { name: "Video Editor", note: "2 editor · 1 proyek revisi, 1 draft" },
  { name: "Finance Manager", note: "Cash flow bulan ini: +Rp 36.800.000" },
  { name: "Business Manager", note: "2 unit bisnis berjalan" },
];

export default function DirectorDashboard() {
  const [tab, setTab] = useState("projects");
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <div>
      <Tabs
        items={[
          { key: "projects", label: "Company Projects" },
          { key: "overview", label: "Directors Overview" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "projects" ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id} onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14.5px] font-semibold text-ink">{p.name}</h3>
                <Badge status={p.status} />
              </div>
              <div className="mt-1 text-[11.5px] text-muted">
                PIC: {p.pic} · Estimasi: {p.eta}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {divisionSummary.map((d) => (
            <Card key={d.name}>
              <h3 className="text-[14.5px] font-semibold text-ink">{d.name}</h3>
              <div className="mt-1 text-[11.5px] text-muted">{d.note}</div>
            </Card>
          ))}
          <div className="rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-[11px] text-gold">
            Data ringkasan ini nanti ditarik otomatis lewat tabel activity_summary — lihat PRD Bagian 11.
          </div>
        </div>
      )}

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && <ProjectDetail project={selected} canEdit />}
      </Sheet>
    </div>
  );
}
