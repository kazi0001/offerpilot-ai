import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealSealUSA",
  description: "AI-assisted deal discovery for busy shoppers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const impactVerificationId = "ad45d846-bb36-4922-9918-1d88015a2855";

  return (
    <html lang="en">
      <head>
        {/* Impact / Target affiliate site verification */}
        <meta
          name="impact-site-verification"
          content={impactVerificationId}
        />

        {/* Extra exact-format fallback for Impact crawler */}
        <meta
          name="impact-site-verification"
          {...({ value: impactVerificationId } as Record<string, string>)}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}