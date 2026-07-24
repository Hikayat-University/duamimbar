import { getSheetRows } from "@/lib/sheets";
import { StatusBadge } from "@/components/ui/Card";

const STATUS_COLUMNS = new Set(["status"]);

export default async function DataTable({
  sheetEnvVar,
  emptyLabel,
}: {
  sheetEnvVar: string;
  emptyLabel: string;
}) {
  const sheetId = process.env[sheetEnvVar];
  if (!sheetId) {
    return (
      <p className="text-sm text-muted">
        Sheet ID belum diisi di <code className="font-mono">.env</code> ({sheetEnvVar}).
      </p>
    );
  }

  const rows = await getSheetRows(sheetId);

  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto rounded-signature border border-denim-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-denim-100 text-left">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2.5 font-medium text-denim-700 whitespace-nowrap">
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={i} className="border-b border-denim-100 last:border-0">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-denim-900">
                  {STATUS_COLUMNS.has(col) ? <StatusBadge status={row[col]} /> : row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
