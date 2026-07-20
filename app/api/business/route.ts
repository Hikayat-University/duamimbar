import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_BUSINESS_OVERVIEW", [
  "id_bisnis",
  "nama_bisnis",
  "deskripsi_singkat",
  "bmc_link",
  "status",
]);
