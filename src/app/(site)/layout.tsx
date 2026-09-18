import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CookieConsent } from "@/components/site/cookie-consent";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsent />
    </>
  );
}
