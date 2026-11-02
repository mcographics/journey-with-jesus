import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Journey with Jesus — Experience the Gospel Through Animated Storytelling",
  description: "Discover the life, teachings, miracles, sacrifice, and resurrection of Jesus through animated storytelling.",
  openGraph: {
    title: "Journey with Jesus — Experience the Gospel Through Animated Storytelling",
    description: "Discover the life, teachings, miracles, sacrifice, and resurrection of Jesus through animated storytelling.",
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-atmosphere" aria-hidden="true">
          <div className="hero-sun" />
          <div className="hero-horizon hero-horizon-back" />
          <div className="hero-horizon hero-horizon-front" />
          <div className="hero-light-path" />
        </div>
        <div className="home-hero-content page-width">
          <p className="eyebrow"><span /> ANIMATED BIBLICAL STORIES</p>
          <h1 id="home-title">Journey<br />with <em>Jesus</em></h1>
          <p className="hero-subtitle">Experience the Gospel Through Animated Storytelling</p>
          <p className="hero-quote">“One extraordinary life. One timeless message.<br className="desktop-break" /> A journey that changes everything.”</p>
          <p className="hero-description">Discover the life, teachings, miracles, sacrifice, and resurrection of Jesus Christ through beautiful, anime-inspired animated stories.</p>
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
          <p className="eyebrow eyebrow-dark">THE STORY THAT STILL SPEAKS</p>
          <h2 id="scripture-title">Bringing Scripture to Life,<br /><em>One Story at a Time</em></h2>
          <p>The Bible is filled with extraordinary moments of faith, courage, compassion, redemption, and hope.</p>
          <p>At Journey with Jesus, our desire is to make these stories accessible and engaging through the art of animation. Combining anime-inspired visuals with Scripture-centered storytelling, we seek to create meaningful experiences that capture the imagination, touch the heart, and encourage a deeper understanding of Jesus Christ.</p>
          <p>Whether you’re exploring Christianity for the first time or have walked in faith for years, there’s a place for you on this journey.</p>
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
            <p className="eyebrow">WHY WE TELL THESE STORIES</p>
            <h2 id="mission-title">More Than Animation.<br /><em>A Message of Hope.</em></h2>
            <p>Our mission is simple: to share the Gospel of Jesus Christ through compelling visual storytelling.</p>
            <p>We believe creative media can help people encounter biblical stories in ways that feel personal, memorable, and meaningful. Our animated narratives seek to remain faithful to the message of Scripture while using modern creative tools to introduce its stories to a new generation.</p>
            <div className="virtue-line" aria-label="Faith, hope, love, redemption">
              <span>Faith</span><b>·</b><span>Hope</span><b>·</b><span>Love</span><b>·</b><span>Redemption</span>
            </div>
          </div>
        </div>
      </section>

      <section className="invitation-section page-width" aria-labelledby="invitation-title">
        <div className="invitation-heading">
          <p className="eyebrow eyebrow-dark"><Sparkles size={14} aria-hidden="true" /> BEGIN WHERE YOU ARE</p>
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
