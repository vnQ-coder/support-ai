export const metadata = {
  title: "SupportAI API",
  description: "SupportAI backend API server",
};

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
