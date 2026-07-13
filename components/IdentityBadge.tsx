import { roleMeta } from "@/lib/data";
import { Role } from "@/lib/types";

const ringColors: Record<Role, string> = {
  director: "ring-gold",
  social: "ring-ok",
  editor: "ring-denim-soft",
  finance: "ring-gold",
  business: "ring-ok",
};

export default function IdentityBadge({ role }: { role: Role }) {
  const meta = roleMeta[role];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-xs font-bold text-white ring-2 ring-offset-2 ring-offset-denim ${ringColors[role]}`}
      >
        {meta.initials}
      </div>
      <div className="leading-tight">
        <div className="font-display text-[13px] font-semibold text-white">{meta.label}</div>
        <div className="text-[10.5px] text-white/60">Mode pratinjau</div>
      </div>
    </div>
  );
}
