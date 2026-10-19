import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        {/* Google Tag Manager — injected as high in <head> as possible */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T2GF94D4');`}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T2GF94D4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
