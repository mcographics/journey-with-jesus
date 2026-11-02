import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const siteUrl = "https://mcographics.github.io/journey-with-jesus/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Journey with Jesus — Animated Biblical Stories",
    template: "%s | Journey with Jesus",
  },
  description: "Journey with Jesus brings Scripture-centered animated stories of faith, hope, love, and redemption to life.",
  applicationName: "Journey with Jesus",
  openGraph: {
    type: "website",
    siteName: "Journey with Jesus",
    title: "Journey with Jesus — Animated Biblical Stories",
    description: "Experience the Gospel through cinematic, anime-inspired animation and Scripture-centered storytelling.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Journey with Jesus — Animated Biblical Stories",
    description: "Experience the Gospel through cinematic, anime-inspired animation and Scripture-centered storytelling.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1120",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Journey with Jesus",
    description: "Journey with Jesus brings Scripture-centered animated stories of faith, hope, love, and redemption to life.",
    url: siteUrl,
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </body>
    </html>
  );
}
