import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ShoppingBag, Sparkles } from "lucide-react";
import { StoreAccessGate } from "@/components/StoreAccessGate";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Kerygma Path Store — Not Available Yet",
  description: "The Kerygma Path store is not available to visitors yet.",
};

const shopSpaces = [
  {
    number: "01",
    title: "Kerygma Path",
    description: "A home for creative releases from the studio.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Journey with Jesus",
    description: "A collection space for our animated storytelling project.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "More stories ahead",
    description: "Room to grow as new projects come to life.",
    icon: ShoppingBag,
  },
];

export default function StorePage() {
  return (
    <StoreAccessGate>
      <main className="editorial-page store-page store-page-v2" id="main-content">
      <div className="store-landing">
        <section aria-labelledby="store-title" className="store-hero">
          <div className="store-hero-copy">
            <p className="store-kicker">
              <span aria-hidden="true" className="store-kicker-line" />
              The Kerygma Path Shop
            </p>
            <h1 className="store-hero-title" id="store-title">
              Stories of faith, <em>beyond the screen.</em>
            </h1>
            <p className="store-lead">
              A future home for releases from Kerygma Path and the stories we bring to life.
              We&apos;re preparing the shop before the first collection arrives.
            </p>
            <p aria-live="polite" className="store-status" role="status">
              <span aria-hidden="true" className="store-status-dot" />
              To be decided
            </p>
          </div>

          <figure className="store-hero-art">
            <Image
              alt="Jesus and a young follower look toward a sunlit city in Journey with Jesus artwork."
              className="store-hero-image"
              fill
              priority
              sizes="(max-width: 820px) 100vw, 48vw"
              src={`${basePath}/images/journey-with-jesus-header-1440.webp`}
              unoptimized
            />
            <figcaption className="store-art-caption">
              <Sparkles aria-hidden="true" size={15} />
              <span>Journey with Jesus · A Kerygma Path project</span>
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="store-preparing-title" className="store-preparing">
          <div aria-hidden="true" className="store-preparing-icon">
            <ShoppingBag size={25} strokeWidth={1.45} />
          </div>
          <div className="store-preparing-copy">
            <p className="store-section-eyebrow">Store preview</p>
            <h2 id="store-preparing-title">We&apos;re getting everything ready.</h2>
            <p>
              The shop isn&apos;t open yet, and no products or checkout are available. This page
              will be updated when the first collection is ready to share.
            </p>
          </div>
          <span className="store-preparing-label">Collection in preparation</span>
        </section>

        <section aria-labelledby="store-spaces-title" className="store-spaces">
          <div className="store-spaces-heading">
            <div>
              <p className="store-section-eyebrow">One studio · many stories</p>
              <h2 id="store-spaces-title">A place for what comes next.</h2>
            </div>
            <p>
              The store is being shaped around Kerygma Path and its projects. These collection
              spaces are a preview of how the shop can grow over time.
            </p>
          </div>

          <div className="store-spaces-grid">
            {shopSpaces.map(({ number, title, description, icon: Icon }) => (
              <article className="store-space-card" key={number}>
                <div className="store-space-topline">
                  <span className="store-space-icon"><Icon aria-hidden="true" size={20} strokeWidth={1.5} /></span>
                  <span className="store-space-number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="store-space-state">In preparation</span>
              </article>
            ))}
          </div>
        </section>

        <nav aria-label="Explore Kerygma Path" className="store-explore-links">
          <Link href="/company/">
            <span>Meet the studio</span>
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <Link href="/projects/journey-with-jesus/">
            <span>Explore Journey with Jesus</span>
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </nav>
      </div>
      </main>
    </StoreAccessGate>
  );
}
