"use client";

import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Tabs from "@/components/Tabs";
import { editorProjects } from "@/lib/data";
import { useRole } from "@/components/RoleProvider";

export default function EditorDashboard() {
  const { editorView, setEditorView } = useRole();

  const visible =
    editorView === "anggota"
      ? editorProjects.filter((p) => p.editor === "Rangga")
      : editorProjects;

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Setiap editor hanya melihat proyek yang ditugaskan padanya
      </p>
      <Tabs
        items={[
          { key: "anggota", label: "Lihat sebagai: Editor" },
          { key: "kepala", label: "Lihat sebagai: Kepala Divisi" },
        ]}
        active={editorView}
        onChange={(v) => setEditorView(v as "anggota" | "kepala")}
      />

      <div className="space-y-3">
        {visible.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14.5px] font-semibold text-ink">{p.title}</h3>
              <Badge status={p.status} />
            </div>
            <div className="mt-1 text-[11.5px] text-muted">
              {editorView === "kepala" ? `Editor: ${p.editor} · ` : ""}Deadline: {p.deadline}
            </div>
          </Card>
        ))}
      </div>

      {editorView === "kepala" && (
        <div className="mt-4 rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-[11px] text-gold">
          Kepala divisi bisa edit semua proyek anggota — tombol edit menyusul setelah field final dikonfirmasi.
        </div>
      )}
    </div>
  );
}
