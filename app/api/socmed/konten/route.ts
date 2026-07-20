import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_SOCMED_KONTEN", [
  "id_konten",
  "id_kanal",
  "judul_konten",
  "status",
  "assigned_editor",
  "tanggal_publish",
]);
