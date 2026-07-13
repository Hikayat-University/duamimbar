"use client";

import { useRole } from "./RoleProvider";
import { roleMeta } from "@/lib/data";
import { Role } from "@/lib/types";
import IdentityBadge from "./IdentityBadge";

export default function TopBar() {
  const { role, setRole } = useRole();

  return (
    <header className="bg-gradient-to-b from-denim to-denim-ink px-4 pb-4 pt-5">
      <div className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-white">
        <span className="h-2 w-2 rounded-full bg-sand" />
        Nama App
      </div>
      <div className="flex items-center justify-between gap-3">
        <IdentityBadge role={role} />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          aria-label="Pratinjau sebagai role lain"
          className="rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-[11px] text-white outline-none"
        >
          {Object.entries(roleMeta).map(([key, meta]) => (
            <option key={key} value={key} className="text-ink">
              {meta.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
