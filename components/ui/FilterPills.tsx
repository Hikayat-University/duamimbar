export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 text-xs font-mono px-2.5 py-1.5 rounded-full border transition-colors ${
            value === opt.value
              ? "bg-denim-700 text-white border-denim-700"
              : "bg-white text-muted border-denim-100 hover:border-denim-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
