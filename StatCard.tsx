export default function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card bg-denim-pale p-3.5">
      <div className="font-display text-xl font-bold text-denim-ink">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}
