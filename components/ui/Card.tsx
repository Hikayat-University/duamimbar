export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-denim-100 rounded-signature p-4 hover:border-denim-300 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Selesai" || status === "Done" || status === "Lunas"
      ? "bg-denim-50 text-denim-700"
      : status === "Berjalan" || status === "Sedang" || status === "Edited"
      ? "bg-gold-400/20 text-gold-500"
      : "bg-surface text-muted";

  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${tone}`}>{status}</span>
  );
}
