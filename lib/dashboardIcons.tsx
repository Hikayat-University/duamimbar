import type { DashboardKey } from "@/lib/permissions";
import {
  LayoutDashboard,
  Radio,
  FileText,
  BarChart3,
  PenLine,
  Palette,
  Clapperboard,
  Send,
  Wallet,
  Calculator,
  Receipt,
  Building2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const DASHBOARD_ICONS: Record<DashboardKey, LucideIcon> = {
  directors_overview: LayoutDashboard,
  socmed_hub: Radio,
  proyek_script_writer: PenLine,
  proyek_graphic_designer: Palette,
  video_editor: Clapperboard,
  admin_posting: Send,
  finance_cashflow: Wallet,
  finance_budget: Calculator,
  finance_hutang: Receipt,
  business_overview: Building2,
  business_flow: TrendingUp,
};
