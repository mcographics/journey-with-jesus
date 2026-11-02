import Image from "next/image";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link aria-label="Journey with Jesus home" className="footer-brand" href="/">
          <Image
            alt=""
            className="footer-wordmark"
            height={778}
            sizes="(max-width: 700px) 210px, 250px"
            src={`${basePath}/images/footer-wordmark-transparent.png`}
            width={2020}
          />
        </Link>
        <div className="footer-message">
          <p className="footer-tagline">Bringing the Gospel to Life</p>
          <p className="footer-note">Faith · Hope · Love · Redemption</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          <Link href="/">Home</Link>
          <span aria-hidden="true">✦</span>
          <Link href="/media/">Media</Link>
        </nav>
      </div>
    </footer>
  );
}
