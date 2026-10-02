import { createClient } from "@/lib/supabase/server";
import type { Proyek } from "@/lib/produksi";
import ProyekBoard from "@/components/studio/ProyekBoard";

export default async function ProyekPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("proyek")
    .select("*")
    .order("tenggat", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <ProyekBoard proyek={(data ?? []) as Proyek[]} />;
}
