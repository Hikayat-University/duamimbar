"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Keluar"
      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-denim-900 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={19} strokeWidth={1.75} className="animate-spin" /> : <LogOut size={19} strokeWidth={1.75} />}
      <span className="hidden sm:inline text-xs">Keluar</span>
    </button>
  );
}
