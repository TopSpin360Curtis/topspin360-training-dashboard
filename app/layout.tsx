import type { Metadata } from "next";
import AuthV2Provider from "@/components/AuthV2Provider";
import { isAuthV2Available } from "@/lib/authV2";
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
  const authV2Enabled = isAuthV2Available();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {authV2Enabled ? <AuthV2Provider>{children}</AuthV2Provider> : children}
      </body>
    </html>
  );
}
