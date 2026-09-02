import { DashboardShell } from "@/components/employee/dashboard-shell";

export default function DashboardLayout({ children }: LayoutProps<"/mitarbeiter">) {
  return <DashboardShell>{children}</DashboardShell>;
}
