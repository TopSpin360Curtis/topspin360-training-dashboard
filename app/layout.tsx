import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopSpin360 Training Dashboard",
  description: "RFD performance dashboard for sports coaches"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
