"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  variant = "icon",
}: {
  variant?: "icon" | "menu";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (variant === "menu") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-denim-100 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} strokeWidth={1.75} />}
        <span className="text-sm font-medium">Keluar</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Keluar"
      className="flex items-center justify-center p-1.5 rounded-lg text-denim-900 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={18} strokeWidth={1.75} className="animate-spin" /> : <LogOut size={18} strokeWidth={1.75} />}
    </button>
  );
}
