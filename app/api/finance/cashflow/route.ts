import { createSheetRoute } from "@/lib/createSheetRoute";

export const { GET, POST } = createSheetRoute("SHEET_ID_FINANCE_CASHFLOW", [
  "id_transaksi",
  "tanggal",
  "tipe",
  "kategori",
  "nominal",
  "keterangan",
  "input_oleh",
]);
