import { CustomerAuthProvider } from "@/lib/customer-auth";

export default function KundenLayout({ children }: LayoutProps<"/kunden">) {
  return <CustomerAuthProvider>{children}</CustomerAuthProvider>;
}
