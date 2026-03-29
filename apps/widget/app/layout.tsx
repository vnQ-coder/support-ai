import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportAI Chat",
  description: "AI-powered customer support chat widget",
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  );
}
