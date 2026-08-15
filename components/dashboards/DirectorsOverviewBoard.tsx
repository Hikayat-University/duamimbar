"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";

type Proyek = {
  id_proyek: string;
  nama_proyek: string;
  deskripsi: string;
  divisi_terlibat: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dibuat_oleh: string;
};

type ChecklistRow = {
  Phase: string;
  Section: string;
  Item: string;
  Prioritas: string;
  Status: string;
  PIC: string;
  Catatan: string;
};

type ChecklistResponse = {
  rows: ChecklistRow[];
  summary: { total: number; selesai: number; belum: number; persenSelesai: number };
};

export default function DirectorsOverviewBoard() {
  const [list, setList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Proyek | null>(null);

  useEffect(() => {
    fetch("/api/proyek")
      .then((res) => res.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  if (list.length === 0) {
    return <p className="text-sm text-muted">Belum ada proyek yang tercatat.</p>;
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <button
            key={p.id_proyek}
            onClick={() => setSelected(p)}
            className="text-left bg-white border border-denim-100 rounded-signature p-4 hover:border-denim-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-medium text-denim-900">{p.nama_proyek}</h3>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-muted line-clamp-2">{p.deskripsi}</p>
            {p.divisi_terlibat && (
              <p className="text-xs text-muted font-mono mt-2">{p.divisi_terlibat}</p>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <ChecklistPanel proyek={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ChecklistPanel({ proyek, onClose }: { proyek: Proyek; onClose: () => void }) {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/proyek/checklist?tab=${encodeURIComponent(proyek.nama_proyek)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal memuat checklist.");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [proyek.nama_proyek]);

  // Kelompokkan baris checklist per Phase, urutan kemunculan pertama dipertahankan.
  const grouped: { phase: string; rows: ChecklistRow[] }[] = [];
  if (data) {
    for (const row of data.rows) {
      const group = grouped.find((g) => g.phase === row.Phase);
      if (group) group.rows.push(row);
      else grouped.push({ phase: row.Phase, rows: [row] });
    }
  }

  return (
    <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
      <div className="bg-white rounded-signature w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-2 p-5 pb-3 border-b border-denim-100">
          <div>
            <h2 className="font-display text-lg text-denim-700">{proyek.nama_proyek}</h2>
            <p className="text-sm text-muted mt-0.5">{proyek.deskripsi}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-denim-900 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 pt-4">
          {loading && <p className="text-sm text-muted">Memuat checklist...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {data && (
            <>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-denim-900">
                    Progress checklist
                  </span>
                  <span className="text-sm text-muted font-mono">
                    {data.summary.selesai}/{data.summary.total} selesai (
                    {data.summary.persenSelesai}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-denim-50 overflow-hidden">
                  <div
                    className="h-full bg-denim-700 rounded-full transition-all"
                    style={{ width: `${data.summary.persenSelesai}%` }}
                  />
                </div>
              </div>

              {data.rows.length === 0 ? (
                <p className="text-sm text-muted">Belum ada item checklist untuk proyek ini.</p>
              ) : (
                <div className="space-y-5">
                  {grouped.map((g) => (
                    <div key={g.phase}>
                      <h3 className="text-xs font-medium text-denim-500 uppercase tracking-wide mb-2">
                        {g.phase}
                      </h3>
                      <ul className="space-y-2">
                        {g.rows.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-3 text-sm border-b border-denim-50 last:border-0 pb-2 last:pb-0"
                          >
                            <div>
                              <p className="text-denim-900">{r.Item}</p>
                              <p className="text-xs text-muted mt-0.5">
                                {r.Section}
                                {r.PIC && ` · ${r.PIC}`}
                              </p>
                            </div>
                            <StatusBadge status={r.Status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
