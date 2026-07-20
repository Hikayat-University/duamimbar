import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_SOCMED_KANAL", [
  "id_kanal",
  "nama_kanal",
  "platform",
  "link",
  "dibuat_pada",
]);
