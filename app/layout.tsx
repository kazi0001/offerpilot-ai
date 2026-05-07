import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealSealUSA",
  description:
    "DealSealUSA helps shoppers discover, compare, and verify useful deals from major retailers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}