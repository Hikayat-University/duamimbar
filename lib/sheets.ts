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
