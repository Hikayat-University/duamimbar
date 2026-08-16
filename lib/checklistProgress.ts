export type ChecklistLikeRow = { Phase: string; Status: string; Prioritas?: string };

export type PhaseStat = { phase: string; total: number; selesai: number; persen: number };

export type ChecklistSummary = {
  total: number;
  selesai: number;
  belum: number;
  /** Persen mentah -- jumlah item selesai / total item. Bisa nyesatin
   * kalau satu phase gede sendiri (lihat brief section 10). */
  persenSelesai: number;
  /** Persen tertimbang -- tiap PHASE dibobot rata, bukan tiap ITEM.
   * Phase kecil (mis. 3 item) nyumbang porsi sama gedenya ke progress
   * keseluruhan kayak phase gede (mis. 50 item). Ini yang dipakai
   * sebagai angka "Progress" utama di UI. */
  persenTertimbang: number;
  criticalBelum: number;
  phaseStats: PhaseStat[];
};

export function computeChecklistSummary(rows: ChecklistLikeRow[]): ChecklistSummary {
  const total = rows.length;
  const selesai = rows.filter((r) => r.Status === "Selesai").length;
  const belum = total - selesai;
  const persenSelesai = total === 0 ? 0 : Math.round((selesai / total) * 100);
  const criticalBelum = rows.filter(
    (r) => r.Status !== "Selesai" && r.Prioritas === "Critical"
  ).length;

  const phaseOrder: string[] = [];
  const byPhase: Record<string, ChecklistLikeRow[]> = {};
  for (const r of rows) {
    if (!byPhase[r.Phase]) {
      byPhase[r.Phase] = [];
      phaseOrder.push(r.Phase);
    }
    byPhase[r.Phase].push(r);
  }

  const phaseStats: PhaseStat[] = phaseOrder.map((phase) => {
    const items = byPhase[phase];
    const done = items.filter((i) => i.Status === "Selesai").length;
    return {
      phase,
      total: items.length,
      selesai: done,
      persen: items.length === 0 ? 0 : Math.round((done / items.length) * 100),
    };
  });

  const persenTertimbang =
    phaseStats.length === 0
      ? 0
      : Math.round(phaseStats.reduce((sum, p) => sum + p.persen, 0) / phaseStats.length);

  return { total, selesai, belum, persenSelesai, persenTertimbang, criticalBelum, phaseStats };
}
