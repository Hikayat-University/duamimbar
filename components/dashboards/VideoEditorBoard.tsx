"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Draf", "Edited", "Revisi", "Done"];

type Proyek = {
  id_proyek_editor: string;
  id_konten: string;
  nama_editor: string;
  status: string;
  catatan: string;
  last_updated: string;
};

export default function VideoEditorBoard({
  currentUserNama,
  canEditAll,
}: {
  currentUserNama: string;
  canEditAll: boolean;
}) {
  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/video-editor")
      .then((res) => res.json())
      .then((data) => setProyek(data))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError(null);

    // optimistic update
    const prev = proyek;
    setProyek((p) => p.map((row) => (row.id_proyek_editor === id ? { ...row, status } : row)));

    const res = await fetch("/api/video-editor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_editor: id, status }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setProyek(prev); // rollback
    }

    setSavingId(null);
  }

  if (loading) {
    return <p className="text-sm text-muted">Memuat proyek...</p>;
  }

  if (proyek.length === 0) {
    return <p className="text-sm text-muted">Belum ada proyek yang di-assign.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {proyek.map((p) => {
        const bisaEdit = canEditAll || p.nama_editor === currentUserNama;
        return (
          <Card key={p.id_proyek_editor}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <p className="text-xs text-muted font-mono mb-0.5">{p.id_konten}</p>
                <p className="font-medium text-denim-900 text-sm">{p.nama_editor}</p>
              </div>
              {!bisaEdit && <StatusBadge status={p.status} />}
            </div>

            {p.catatan && <p className="text-sm text-muted mb-2">{p.catatan}</p>}

            {bisaEdit ? (
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={p.status}
                  disabled={savingId === p.id_proyek_editor}
                  onChange={(e) => updateStatus(p.id_proyek_editor, e.target.value)}
                  className="text-xs font-mono rounded-full border border-denim-100 px-3 py-1.5 bg-white outline-none focus:border-denim-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {savingId === p.id_proyek_editor && (
                  <span className="text-xs text-muted">Menyimpan...</span>
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
