import Link from "next/link";
import ResponsivePicture from "@/components/ResponsivePicture";
import SocialLinks from "@/components/SocialLinks";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-stack">
        <Link aria-label="Kerygma Path home" className="footer-brand kerygma-footer-brand" href="/">
          <ResponsivePicture
            alt=""
            className="kerygma-footer-logo"
            height={724}
            fallbackSrc={`${basePath}/images/kerygma-path-gateway-logo-complete-840.webp`}
            loading="lazy"
            pictureClassName="kerygma-footer-logo-picture"
            sizes="(max-width: 580px) 110px, 140px"
            webpSources={[480, 840].map((width) => ({
              src: `${basePath}/images/kerygma-path-gateway-logo-complete-${width}.webp`,
              width,
            }))}
            width={2172}
          />
        </Link>
          <SocialLinks />
        </div>
        <div className="footer-content">
        <div className="footer-message">
          <p className="footer-tagline">Christian animation with purpose</p>
          <p className="footer-note">Faith · Scripture · Story</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          <Link href="/">Kerygma Path</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/company/">The Studio</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/projects/journey-with-jesus/">Journey with Jesus</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/media/">Media</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/studio/">Upper Room</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/policies/privacy/">Privacy</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/policies/terms/">Terms</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/policies/community-guidelines/">Community Guidelines</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/policies/cookies/">Cookies</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/policies/copyright/">Copyright</Link>
        </nav>
        <p className="footer-note footer-credits">
          Kerygma Path · Current project: Journey with Jesus · Website by{" "}
          <a href="https://mcographics.github.io/">Majestic Creations</a>
        </p>
        </div>
      </div>
    </footer>
  );
}
