import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Baltic Freight GmbH – Spedition & Logistik aus Falkenwalde",
    template: "%s | Baltic Freight GmbH",
  },
  description:
    "Baltic Freight GmbH ist Ihre Spedition in Falkenwalde für nationale und internationale Transporte, Lagerlogistik und digitale Disposition.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-mist-50 text-navy-900">{children}</body>
    </html>
  );
}
