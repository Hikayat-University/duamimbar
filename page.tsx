"use client";

import { useRole } from "@/components/RoleProvider";
import { roleMeta } from "@/lib/data";
import DirectorDashboard from "@/components/dashboards/DirectorDashboard";
import SocialDashboard from "@/components/dashboards/SocialDashboard";
import EditorDashboard from "@/components/dashboards/EditorDashboard";
import FinanceDashboard from "@/components/dashboards/FinanceDashboard";
import BusinessDashboard from "@/components/dashboards/BusinessDashboard";

export default function MyPage() {
  const { role } = useRole();

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-lg font-bold text-denim-ink">
          My Page — {roleMeta[role].label}
        </h1>
      </div>

      {role === "director" && <DirectorDashboard />}
      {role === "social" && <SocialDashboard />}
      {role === "editor" && <EditorDashboard />}
      {role === "finance" && <FinanceDashboard />}
      {role === "business" && <BusinessDashboard />}
    </div>
  );
}
