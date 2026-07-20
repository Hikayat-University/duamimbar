import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow } from "@/lib/sheets";

/**
 * Bikin GET + POST handler untuk satu tabel/sheet.
 * `columns` menentukan urutan kolom saat insert (harus sama urutan dengan header sheet).
 */
export function createSheetRoute(sheetEnvVar: string, columns: string[]) {
  const sheetId = process.env[sheetEnvVar]!;

  async function GET() {
    const rows = await getSheetRows(sheetId);
    return NextResponse.json(rows);
  }

  async function POST(req: NextRequest) {
    const body = await req.json();
    const values = columns.map((col) =>
      col.startsWith("id") ? crypto.randomUUID() : body[col] ?? ""
    );
    await appendSheetRow(sheetId, values);
    return NextResponse.json({ success: true });
  }

  return { GET, POST };
}
