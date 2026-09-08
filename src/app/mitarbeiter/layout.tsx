import { AuthProvider } from "@/lib/auth";

export default function MitarbeiterLayout({ children }: LayoutProps<"/mitarbeiter">) {
  return <AuthProvider>{children}</AuthProvider>;
}
