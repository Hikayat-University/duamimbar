export interface TabItem {
  key: string;
  label: string;
}

export default function Tabs({
  items,
  active,
  onChange,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold transition-colors ${
            active === item.key
              ? "border-denim bg-denim text-white"
              : "border-border bg-white text-muted"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
