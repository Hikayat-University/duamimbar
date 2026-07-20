import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_FINANCE_HUTANG", [
  "id_catatan",
  "tipe",
  "pihak_terkait",
  "nominal",
  "jatuh_tempo",
  "status",
  "catatan",
]);
