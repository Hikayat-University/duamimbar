export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 border border-dashed border-denim-100 rounded-signature">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
