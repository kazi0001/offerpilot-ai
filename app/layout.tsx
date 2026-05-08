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
  const impactVerificationId = "203afec9-16dc-4c42-859b-402fc403f74c";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard meta tag format */}
        <meta
          name="impact-site-verification"
          content={impactVerificationId}
        />

        {/* Impact exact-format fallback using value attribute */}
        <meta
          name="impact-site-verification"
          {...({ value: impactVerificationId } as Record<string, string>)}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}