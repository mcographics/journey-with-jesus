import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";
import "./media-studio.css";

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
  colorScheme: "light dark",
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const savedMode = localStorage.getItem("journey-with-jesus-theme-mode");
                const mode = savedMode === "light" || savedMode === "dark" ? savedMode : "auto";
                const hour = new Date().getHours();
                const theme = mode === "auto" ? (hour >= 7 && hour < 19 ? "light" : "dark") : mode;
                document.documentElement.dataset.themeMode = mode;
                document.documentElement.dataset.theme = theme;
                document.querySelector('meta[name="theme-color"]')?.setAttribute(
                  "content",
                  theme === "light" ? "#f8f6f0" : "#0B1120",
                );
              } catch {}
            })();`,
          }}
        />
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
