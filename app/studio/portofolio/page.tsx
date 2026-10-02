import { createClient } from "@/lib/supabase/server";
import type { Karya } from "@/lib/produksi";
import PortofolioBoard from "@/components/studio/PortofolioBoard";

export default async function PortofolioStudioPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("karya")
    .select("*")
    .order("urutan")
    .order("created_at", { ascending: false });
  return <PortofolioBoard karya={(data ?? []) as Karya[]} />;
}
