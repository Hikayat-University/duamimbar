"use client";

/**
 * Tracker horizontal kayak "Pesanan Saya" Shopee — nunjukin tahap "jalan
 * maju" (bukan status Revisi, yang ditampilin terpisah sebagai alert
 * karena itu bukan langkah maju tapi "dibalikin").
 */
export default function StatusStepper({
  stages,
  current,
}: {
  stages: string[];
  current: string;
}) {
  const idx = stages.indexOf(current);

  return (
    <div className="flex items-start w-full py-1">
      {stages.map((s, i) => (
        <div key={s} className={`flex items-center ${i === stages.length - 1 ? "" : "flex-1"}`}>
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                i < idx
                  ? "bg-denim-700 text-white"
                  : i === idx
                  ? "bg-gold-500 text-white"
                  : "bg-surface text-muted border border-denim-100"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              className={`text-[9px] mt-1 text-center leading-tight w-14 ${
                i <= idx ? "text-denim-900 font-medium" : "text-muted"
              }`}
            >
              {s}
            </span>
          </div>
          {i < stages.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-3.5 ${i < idx ? "bg-denim-700" : "bg-denim-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
