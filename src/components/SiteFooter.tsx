import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="footer-brand" href="/">Journey with Jesus</Link>
        <p className="footer-tagline"><em>Journey with Jesus</em> — Bringing the Gospel to Life.</p>
        <span className="footer-note">Faith · Hope · Love · Redemption</span>
      </div>
    </footer>
  );
}
