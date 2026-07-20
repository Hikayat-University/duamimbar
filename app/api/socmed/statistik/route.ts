import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_SOCMED_STATISTIK", [
  "id_statistik",
  "id_konten",
  "minggu_ke",
  "tanggal_input",
  "views",
  "likes",
  "reach",
  "engagement_rate",
]);
