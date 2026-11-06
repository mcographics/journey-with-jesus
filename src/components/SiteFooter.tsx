import Image from "next/image";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-inner">
        <Link aria-label="Kerygma Path home" className="footer-brand kerygma-footer-brand" href="/">
          <Image
            alt=""
            className="kerygma-footer-logo"
            height={724}
            sizes="(max-width: 580px) 110px, 140px"
            src={`${basePath}/images/kerygma-path-gateway-logo-complete.webp`}
            unoptimized
            width={2172}
          />
        </Link>
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
        <p className="footer-note footer-credits">Kerygma Path · Current project: Journey with Jesus · Website by Majestic Creations</p>
        </div>
      </div>
    </footer>
  );
}
