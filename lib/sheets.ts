import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/** Baca semua baris sebuah sheet (baris pertama dianggap header). */
export async function getSheetRows(sheetId: string, range = "A1:Z1000") {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const [header, ...rows] = res.data.values ?? [[]];
  if (!header) return [];

  return rows.map((row) =>
    Object.fromEntries(header.map((key: string, i: number) => [key, row[i] ?? ""]))
  );
}

/** Tambah satu baris baru ke akhir sheet. */
export async function appendSheetRow(sheetId: string, values: (string | number)[]) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/**
 * Update sebagian kolom pada satu baris yang sudah ada, dicari berdasarkan
 * nilai di kolom tertentu (mis. cari baris dengan id_proyek_editor = "xxx").
 * Kolom yang tidak disebut di `updates` tidak akan berubah.
 */
export async function updateSheetRow(
  sheetId: string,
  matchColumn: string,
  matchValue: string,
  updates: Record<string, string>
) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:Z1000",
  });

  const [header, ...rows] = res.data.values ?? [[]];
  if (!header) throw new Error("Sheet kosong atau tidak ada header.");

  const matchIndex = header.indexOf(matchColumn);
  if (matchIndex === -1) throw new Error(`Kolom ${matchColumn} tidak ditemukan.`);

  const rowIndex = rows.findIndex((row) => row[matchIndex] === matchValue);
  if (rowIndex === -1) throw new Error(`Baris dengan ${matchColumn}=${matchValue} tidak ditemukan.`);

  const currentRow = rows[rowIndex];
  const updatedRow = header.map((col: string, i: number) =>
    updates[col] !== undefined ? updates[col] : currentRow[i] ?? ""
  );

  const sheetRowNumber = rowIndex + 2; // +1 untuk header, +1 karena Sheets 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `A${sheetRowNumber}:Z${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updatedRow] },
  });
}

/** Hapus satu baris, dicari berdasarkan nilai di kolom tertentu. */
export async function deleteSheetRow(sheetId: string, matchColumn: string, matchValue: string) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  // Ambil grid ID sheet (bukan spreadsheetId) — dibutuhkan API untuk hapus baris
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const gridId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:Z1000",
  });
  const [header, ...rows] = res.data.values ?? [[]];
  if (!header) throw new Error("Sheet kosong atau tidak ada header.");

  const matchIndex = header.indexOf(matchColumn);
  if (matchIndex === -1) throw new Error(`Kolom ${matchColumn} tidak ditemukan.`);

  const rowIndex = rows.findIndex((row) => row[matchIndex] === matchValue);
  if (rowIndex === -1) throw new Error(`Baris dengan ${matchColumn}=${matchValue} tidak ditemukan.`);

  const startIndex = rowIndex + 1; // +1 karena baris header ada di index 0

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: gridId,
              dimension: "ROWS",
              startIndex,
              endIndex: startIndex + 1,
            },
          },
        },
      ],
    },
  });
}
