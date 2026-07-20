import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_VIDEO_EDITOR_PROYEK", [
  "id_proyek_editor",
  "id_konten",
  "nama_editor",
  "status",
  "catatan",
  "last_updated",
]);
