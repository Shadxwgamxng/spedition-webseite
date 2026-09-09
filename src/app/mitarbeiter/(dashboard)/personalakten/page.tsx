"use client";

import { useAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/roles";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { PersonnelFilesManager } from "@/components/employee/personnel-files-manager";

export default function PersonalaktenPage() {
  const { user } = useAuth();

  if (!user || !canAccessModule(user.roleKey, "personalakten")) {
    return <p className="text-sm text-navy-700/60">Kein Zugriff.</p>;
  }

  return (
    <div>
      <EmployeePageHeader
        title="Personalakten"
        description="Persönliche Daten, Beschäftigungsdaten und Dokumente je Mitarbeiter-Konto verwalten."
      />
      <div className="mt-6">
        <PersonnelFilesManager />
      </div>
    </div>
  );
}
