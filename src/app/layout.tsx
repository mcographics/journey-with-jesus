import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";
import "./media-studio.css";
import "./editorial-pages.css";
import "./character-cards.css";
import "./kerygma-pages.css";
import "./accessibility.css";

const siteUrl = "https://kerygmapath.com/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kerygma Path — Christian Animation Studio",
    template: "%s | Kerygma Path",
  },
  description: "Kerygma Path is a Christian animation studio sharing the Gospel through Scripture-rooted animated storytelling.",
  applicationName: "Kerygma Path",
  openGraph: {
    type: "website",
    siteName: "Kerygma Path",
    title: "Kerygma Path — Christian Animation Studio",
    description: "Christian animation sharing the Gospel through Scripture-rooted storytelling.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Kerygma Path — Christian Animation Studio",
    description: "Christian animation sharing the Gospel through Scripture-rooted storytelling.",
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
    name: "Kerygma Path",
    description: "Kerygma Path is a Christian animation studio sharing the Gospel through Scripture-rooted storytelling.",
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
                  theme === "light" ? "#f2f5f9" : "#0B1120",
                );
                const savedAccessibility = localStorage.getItem("journey-with-jesus-accessibility");
                const accessibility = savedAccessibility ? JSON.parse(savedAccessibility) : {};
                const brightness = Number.isFinite(accessibility.brightness)
                  ? Math.max(70, Math.min(100, Math.round(accessibility.brightness / 5) * 5))
                  : 100;
                const reduceMotion = typeof accessibility.reduceMotion === "boolean"
                  ? accessibility.reduceMotion
                  : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const root = document.documentElement;
                root.dataset.accessibilityBrightness = String(brightness);
                root.dataset.accessibilityTextSize = ["large", "largest"].includes(accessibility.textSize) ? accessibility.textSize : "default";
                root.dataset.accessibilityLineSpacing = String(accessibility.relaxedLineSpacing === true);
                root.dataset.accessibilityUnderlineLinks = String(accessibility.underlineLinks === true);
                root.dataset.accessibilityContrast = accessibility.highContrast === true ? "high" : "standard";
                const colorVisionModes = ["standard", "protanopia", "deuteranopia", "tritanopia", "monochromacy"];
                const colorVisionMode = colorVisionModes.includes(accessibility.colorVisionMode)
                  ? accessibility.colorVisionMode
                  : accessibility.colorVisionFriendly === true ? "deuteranopia" : "standard";
                root.dataset.accessibilityColorVision = colorVisionMode;
                root.dataset.accessibilityEnhancedFocus = String(accessibility.enhancedFocus === true);
                root.dataset.accessibilityReduceMotion = String(reduceMotion);
                root.style.setProperty("--light-mode-overlay-opacity", String(((100 - brightness) / 30) * 0.2));
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
