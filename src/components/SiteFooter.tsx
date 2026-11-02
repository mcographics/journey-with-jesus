import Image from "next/image";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="footer-banner" href="/">
          <Image
            alt="Journey with Jesus — Bringing the Gospel to Life. Faith, Hope, Love, Redemption."
            className="footer-banner-image"
            fill
            sizes="100vw"
            src={`${basePath}/images/journey-with-jesus-footer.jpg`}
          />
        </Link>
      </div>
    </footer>
  );
}
