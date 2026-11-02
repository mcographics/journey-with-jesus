import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Store",
  description: "The Journey with Jesus store is coming soon.",
};

export default function StorePage() {
  return (
    <main className="editorial-page store-page" id="main-content">
      <div className="store-card">
        <div aria-hidden="true" className="store-emblem"><ShoppingBag size={27} strokeWidth={1.25} /></div>
        <p className="editorial-eyebrow">Journey with Jesus</p>
        <h1>Store</h1>
        <p className="store-coming-soon">Coming Soon</p>
        <p className="store-intro">The store is still being prepared. Please check back soon.</p>
        <Link className="store-home-link" href="/">
          <span>Return to Home</span><ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </main>
  );
}
