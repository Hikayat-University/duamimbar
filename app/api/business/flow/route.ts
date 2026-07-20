import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_BUSINESS_FLOW", [
  "id_flow",
  "id_bisnis",
  "tanggal",
  "tipe",
  "nominal",
  "keterangan",
  "status_setor_ke_finance",
  "catatan_finance",
]);
