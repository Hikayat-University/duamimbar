import type { DashboardKey } from "@/lib/permissions";
import {
  LayoutDashboard,
  Radio,
  FileText,
  BarChart3,
  PenLine,
  Palette,
  Clapperboard,
  Wallet,
  Calculator,
  Receipt,
  Building2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const DASHBOARD_ICONS: Record<DashboardKey, LucideIcon> = {
  directors_overview: LayoutDashboard,
  socmed_kanal: Radio,
  socmed_overview: FileText,
  socmed_statistik: BarChart3,
  proyek_script_writer: PenLine,
  proyek_graphic_designer: Palette,
  video_editor: Clapperboard,
  finance_cashflow: Wallet,
  finance_budget: Calculator,
  finance_hutang: Receipt,
  business_overview: Building2,
  business_flow: TrendingUp,
};
