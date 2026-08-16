export function VerdictCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="bg-white border border-denim-100 rounded-signature p-3.5">
      {icon && (
        <div className={`w-7 h-7 rounded-signature flex items-center justify-center mb-2 ${tone ?? "bg-denim-50 text-denim-700"}`}>
          {icon}
        </div>
      )}
      <p className="text-lg font-display text-denim-900">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
