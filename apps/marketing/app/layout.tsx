import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SupportAI — AI Customer Support That Just Works",
    template: "%s | SupportAI",
  },
  description:
    "Resolve 60% of support tickets automatically with AI. Flat-rate pricing, 5-minute setup, 30+ languages.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SupportAI",
    title: "SupportAI — AI Customer Support That Just Works",
    description:
      "Resolve 60% of support tickets automatically with AI. Flat-rate pricing, 5-minute setup, 30+ languages.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SupportAI — AI Customer Support That Just Works",
    description:
      "Resolve 60% of support tickets automatically with AI. Flat-rate pricing, 5-minute setup, 30+ languages.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
