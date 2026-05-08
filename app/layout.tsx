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
      <head>
        <meta
          name="impact-site-verification"
          value="203afec9-16dc-4c42-859b-402fc403f74c"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}