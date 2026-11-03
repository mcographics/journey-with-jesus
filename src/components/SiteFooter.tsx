import Link from "next/link";
import ResponsivePicture, { type PictureCandidate } from "@/components/ResponsivePicture";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const wordmarkSources: PictureCandidate[] = [420, 810].map((width) => ({
  src: `${basePath}/images/footer-wordmark-transparent-${width}.webp`,
  width,
}));

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link aria-label="Journey with Jesus home" className="footer-brand" href="/">
          <ResponsivePicture
            alt=""
            className="footer-wordmark"
            height={778}
            fallbackSrc={`${basePath}/images/footer-wordmark-fallback.png`}
            loading="lazy"
            sizes="(max-width: 700px) 210px, 250px"
            webpSources={wordmarkSources}
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
          <span aria-hidden="true">✦</span>
          <Link href="/studio/">Upper Room</Link>
        </nav>
      </div>
    </footer>
  );
}
