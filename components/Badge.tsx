const styles: Record<string, string> = {
  ok: "bg-ok/10 text-ok",
  wait: "bg-gold/10 text-gold",
  plan: "bg-denim-pale text-denim",
  danger: "bg-danger/10 text-danger",
};

function toneFor(status: string): keyof typeof styles {
  const s = status.toLowerCase();
  if (["berjalan", "sedang", "revisi", "belum lunas"].includes(s)) return "wait";
  if (["selesai", "final", "lunas"].includes(s)) return "ok";
  return "plan";
}

export default function Badge({ status }: { status: string }) {
  const tone = toneFor(status);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[tone]}`}
    >
      {status}
    </span>
  );
}
