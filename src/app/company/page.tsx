import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "The Studio",
  description:
    "Meet Kerygma Path, a Christian animation studio using AI and creative tools to tell Gospel-centered stories.",
};

export default function CompanyPage() {
  return (
    <main className="kerygma-company" id="main-content">
      <section aria-labelledby="studio-title" className="kerygma-company-hero">
        <div aria-hidden="true" className="kerygma-company-hero-art">
          <Image
            alt=""
            className="kerygma-company-hero-image"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 52vw"
            src={`${basePath}/images/scripture-city-story-2560.webp`}
            unoptimized
          />
        </div>
        <div aria-hidden="true" className="kerygma-company-hero-shade" />
        <div className="kerygma-company-hero-content">
          <p className="kerygma-eyebrow"><span /> The Studio</p>
          <h1 id="studio-title">
            Faithful to the Word.<br />
            <em>Made for the screen.</em>
          </h1>
          <p className="kerygma-company-lead">
            Kerygma Path is a Christian animation studio devoted to sharing the Gospel through powerful, Scripture-rooted storytelling.
          </p>
          <p className="kerygma-company-supporting">
            We use AI and a range of creative tools to pursue the highest quality storytelling possible—bringing the message of the Gospel to life in animation.
          </p>
          <div className="kerygma-hero-actions">
            <Link className="kerygma-button kerygma-button-gold" href="/projects/journey-with-jesus/">
              <span>Explore Our Project</span><ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a className="kerygma-text-link" href="#our-approach">Our approach</a>
          </div>
        </div>
        <p className="kerygma-hero-caption">Rooted in Scripture · Created to share the Gospel</p>
      </section>

      <section aria-labelledby="mission-title" className="kerygma-mission-section" id="our-approach">
        <div className="kerygma-section-inner">
          <div className="kerygma-section-heading">
            <p className="kerygma-eyebrow"><span /> Our purpose</p>
            <h2 id="mission-title">Stories can help the message <em>reach the heart.</em></h2>
          </div>
          <div className="kerygma-mission-copy">
            <p>
              Our aim is to share the Gospel of Jesus Christ through animated stories that are thoughtful, moving, and grounded in Scripture.
            </p>
            <p>
              We believe modern creative tools—including AI—can open new ways to bring biblical stories to the screen. The tools serve the storytelling; the Gospel remains at the center.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="approach-title" className="kerygma-principles-section">
        <div className="kerygma-section-inner">
          <div className="kerygma-section-heading kerygma-section-heading-centered">
            <p className="kerygma-eyebrow"><span /> What guides the work</p>
            <h2 id="approach-title">Technology in service of <em>story.</em></h2>
          </div>
          <div className="kerygma-principles-grid">
            <article className="kerygma-principle-card">
              <span className="kerygma-principle-number">01</span>
              <BookOpen aria-hidden="true" size={24} strokeWidth={1.4} />
              <h3>Scripture at the center</h3>
              <p>Every project begins with the biblical message it is meant to share.</p>
            </article>
            <article className="kerygma-principle-card">
              <span className="kerygma-principle-number">02</span>
              <Sparkles aria-hidden="true" size={24} strokeWidth={1.4} />
              <h3>Creative tools, carefully used</h3>
              <p>AI and other tools help us explore new possibilities for visual storytelling.</p>
            </article>
            <article className="kerygma-principle-card">
              <span className="kerygma-principle-number">03</span>
              <ArrowRight aria-hidden="true" size={24} strokeWidth={1.4} />
              <h3>Quality in every story</h3>
              <p>We aim to make the story engaging, memorable, and worthy of its message.</p>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="project-title" className="kerygma-project-section">
        <div className="kerygma-project-inner">
          <div className="kerygma-project-copy">
            <p className="kerygma-eyebrow"><span /> Current project · 01</p>
            <h2 id="project-title">Journey with <em>Jesus</em></h2>
            <p>
              An animated journey through the life, teachings, miracles, sacrifice, and resurrection of Jesus Christ. This is the first project from Kerygma Path.
            </p>
            <Link className="kerygma-button kerygma-button-outline" href="/projects/journey-with-jesus/">
              <span>Discover the Project</span><ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="kerygma-project-secondary" href="/media/">Visit the media page</Link>
          </div>
          <div className="kerygma-project-art">
            <Image
              alt="Jesus welcomes a young man as they look across a sunlit valley toward an ancient city."
              className="kerygma-project-image"
              fill
              loading="lazy"
              sizes="(max-width: 800px) 100vw, 50vw"
              src={`${basePath}/images/journey-with-jesus-header-2560.webp`}
              unoptimized
            />
            <span aria-hidden="true" className="kerygma-project-art-frame" />
          </div>
        </div>
      </section>

      <section aria-labelledby="team-title" className="kerygma-team-invitation">
        <div className="kerygma-section-inner kerygma-team-invitation-inner">
          <div>
            <p className="kerygma-eyebrow"><span /> The people behind the work</p>
            <h2 id="team-title">A small team. <em>A message worth sharing.</em></h2>
          </div>
          <Link className="kerygma-button kerygma-button-gold" href="/team/">
            <span>Meet the Team</span><ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
