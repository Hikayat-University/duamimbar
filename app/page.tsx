"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Sheet from "@/components/Sheet";
import ProjectDetail from "@/components/ProjectDetail";
import { projects } from "@/lib/data";
import { useRole } from "@/components/RoleProvider";
import { Project } from "@/lib/types";

export default function HomePage() {
  const { role } = useRole();
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-lg font-bold text-denim-ink">
          Overview Proyek Perusahaan
        </h1>
        <p className="mt-1 text-xs text-muted">
          Terlihat oleh semua tim · edit hanya Head Director
        </p>
      </div>

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

      {role === "director" && (
        <button
          aria-label="Tambah proyek"
          className="absolute bottom-24 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-denim text-2xl text-white shadow-floating"
        >
          +
        </button>
      )}

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && <ProjectDetail project={selected} canEdit={role === "director"} />}
      </Sheet>
    </div>
  );
}
