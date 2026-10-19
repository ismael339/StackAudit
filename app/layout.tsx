import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "StackAudit — Audit your Shopify app stack",
    template: "%s | StackAudit",
  },
  description:
    "Connect your Shopify store, see every installed app and its cost, cut waste and save money. Audit your app stack in minutes.",
  keywords: [
    "Shopify",
    "app audit",
    "Shopify apps",
    "reduce costs",
    "SaaS savings",
  ],
  openGraph: {
    title: "StackAudit — Audit your Shopify app stack",
    description: "Cut waste. Save money. See exactly what your Shopify apps cost.",
    type: "website",
    siteName: "StackAudit",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackAudit — Audit your Shopify app stack",
    description: "Cut waste. Save money.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
