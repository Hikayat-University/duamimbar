import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_FINANCE_BUDGET", [
  "id_budget",
  "id_proyek",
  "nama_item",
  "estimasi_biaya",
  "realisasi_biaya",
  "catatan",
]);
