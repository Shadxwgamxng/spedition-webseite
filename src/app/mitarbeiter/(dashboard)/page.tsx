import Link from "next/link";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { SettingsIcon } from "@/components/ui/icons";

export default function DashboardOverviewPage() {
  return (
    <div>
      <EmployeePageHeader
        title="Mitarbeiterbereich"
        description="Von hier aus verwalten Sie die Inhalte der öffentlichen Website."
      />
      <Link
        href="/mitarbeiter/verwaltung"
        className="flex max-w-sm items-center gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-navy-900">Website-Verwaltung</div>
          <div className="text-sm text-navy-700/60">News, Stellenangebote, Fuhrpark, Team u. v. m. pflegen</div>
        </div>
      </Link>
    </div>
  );
}
