import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Journey with Jesus — Experience the Gospel Through Animated Storytelling",
  description: "Experience the Gospel through cinematic, anime-inspired animation and Scripture-centered stories of Jesus Christ.",
  openGraph: {
    title: "Journey with Jesus — Experience the Gospel Through Animated Storytelling",
    description: "Experience the Gospel through cinematic, anime-inspired animation and Scripture-centered stories of Jesus Christ.",
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <div className="home-masthead">
        <Image
          alt="Journey with Jesus illustrated banner: Jesus and a young man overlooking Jerusalem at sunset, with the words 'An Animated Journey Through God's Word.'"
          className="home-masthead-image"
          height={2049}
          preload
          sizes="100vw"
          src={`${basePath}/images/journey-with-jesus-header.jpg`}
          width={6144}
        />
      </div>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content page-width">
          <p className="eyebrow"><span /> ANIMATED BIBLICAL STORIES</p>
          <h1 className="visually-hidden" id="home-title">Journey with Jesus</h1>
          <p className="hero-subtitle">Experience the Gospel Through Animated Storytelling</p>
          <p className="hero-quote">“One extraordinary life. One timeless message.<br className="desktop-break" /> A journey that changes everything.”</p>
          <p className="hero-description">Discover the life, teachings, miracles, sacrifice, and resurrection of Jesus Christ through beautiful, anime-inspired animated stories.</p>
          <p className="hero-introduction"><em>Journey with Jesus</em> brings biblical narratives to life through cinematic visuals, emotional storytelling, and a fresh artistic perspective—inviting audiences of all ages to experience the message of the Gospel.</p>
          <Link className="button button-gold" href="/media/">
            <span>Watch the Stories</span><ArrowRight aria-hidden="true" size={18} />
          </Link>
          <span className="hero-side-note">FAITH · HOPE · LOVE</span>
        </div>
        <a className="scroll-cue" href="#scripture" aria-label="Scroll to learn about the project"><span /> Discover the journey</a>
      </section>

      <section className="story-section page-width" id="scripture" aria-labelledby="scripture-title">
        <div className="section-index"><span>01</span><i /></div>
        <div className="story-copy">
          <p className="eyebrow eyebrow-dark">OUR STORY</p>
          <h2 id="scripture-title">Bringing Scripture to Life,<br /><em>One Story at a Time</em></h2>
          <p>The Bible is filled with extraordinary moments of faith, courage, compassion, redemption, and hope.</p>
          <p>At Journey with Jesus, our desire is to make these stories accessible and engaging through the art of animation.</p>
          <p>Combining anime-inspired visuals with Scripture-centered storytelling, we seek to create meaningful experiences that capture the imagination, touch the heart, and encourage a deeper understanding of Jesus Christ.</p>
          <p>Whether you&apos;re exploring Christianity for the first time or have walked in faith for years, there&apos;s a place for you on this journey.</p>
        </div>
        <div className="story-emblem" aria-hidden="true">
          <div className="emblem-orbit orbit-one" />
          <div className="emblem-orbit orbit-two" />
          <div className="emblem-center"><BookOpen size={36} strokeWidth={1.2} /></div>
          <span className="emblem-caption">A LIVING STORY</span>
        </div>
      </section>

      <section className="mission-section" aria-labelledby="mission-title">
        <div className="mission-inner page-width">
          <div className="mission-art" aria-hidden="true">
            <div className="mission-glow" />
            <span className="mission-quote-mark">“</span>
            <span className="mission-art-caption">A MESSAGE OF HOPE<br />FOR EVERY GENERATION</span>
          </div>
          <div className="mission-copy">
            <div className="section-index section-index-light"><span>02</span><i /></div>
            <p className="eyebrow">OUR MISSION</p>
            <h2 id="mission-title">More Than Animation.<br /><em>A Message of Hope.</em></h2>
            <p>Our mission is simple: <strong>to share the Gospel of Jesus Christ through compelling visual storytelling.</strong></p>
            <p>We believe creative media can help people encounter biblical stories in ways that feel personal, memorable, and meaningful.</p>
            <p>Our animated narratives seek to remain faithful to the message of Scripture while using modern creative tools to introduce its stories to a new generation.</p>
            <p className="virtue-statement"><strong>Faith. Hope. Love. Redemption.</strong></p>
            <p className="virtue-description">These are more than themes. They are at the heart of the journey.</p>
          </div>
        </div>
      </section>

      <section className="invitation-section page-width" aria-labelledby="invitation-title">
        <div className="invitation-heading">
          <p className="eyebrow eyebrow-dark"><Sparkles size={14} aria-hidden="true" /> BEGIN YOUR JOURNEY</p>
          <h2 id="invitation-title">Every Story Has a Purpose.<br /><em>Every Journey Begins Somewhere.</em></h2>
          <p>Explore animated episodes inspired by Scripture, discover the teachings of Jesus, and experience the greatest story ever told through a new visual perspective.</p>
        </div>
        <Link className="media-invitation" href="/media/">
          <span className="invitation-icon"><Heart size={22} strokeWidth={1.4} aria-hidden="true" /></span>
          <span className="invitation-text"><small>YOUR NEXT CHAPTER</small><strong>Explore Our Media</strong></span>
          <span className="invitation-arrow"><ArrowRight size={19} aria-hidden="true" /></span>
        </Link>
      </section>
    </main>
  );
}
