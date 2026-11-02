import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";
import MastheadTicker from "@/components/MastheadTicker";
import MastheadEasterEgg from "@/components/MastheadEasterEgg";

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
      <MastheadEasterEgg imageSrc={`${basePath}/images/header-easter-egg.webp`}>
        <Image
          alt="Journey with Jesus illustrated banner: Jesus and a contemporary young man overlooking a sunlit valley."
          className="home-masthead-image"
          height={2466}
          preload
          sizes="100vw"
          src={`${basePath}/images/journey-with-jesus-header-3x.jpg`}
          width={5742}
        />
        <MastheadTicker />
      </MastheadEasterEgg>
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

      <section className="storybook-section" id="scripture" aria-labelledby="scripture-title">
        <Image
          alt=""
          aria-hidden="true"
          className="storybook-background"
          fill
          sizes="100vw"
          src={`${basePath}/images/scripture-city-story.webp`}
        />
        <div className="storybook-shade" aria-hidden="true" />
        <div className="page-width storybook-layout">
          <article className="storybook-copy">
            <p className="storybook-eyebrow"><Sparkles size={15} aria-hidden="true" /><span>Our Story</span><i>01</i></p>
            <h2 className="storybook-title" id="scripture-title">Bringing Scripture to Life<em>One Story at a Time</em></h2>
            <p className="storybook-lead">Every great journey begins with a story. This one leads to Jesus.</p>
            <p>The Bible is filled with unforgettable moments of courage, compassion, miracles, and hope. We bring these Scripture-rooted stories to life through vivid animation and heartfelt storytelling.</p>
            <p>Follow the journey of Jesus—from his teachings and miracles to the promise of resurrection—and discover the timeless message at the heart of every story.</p>
            <p>Whether you are opening Scripture for the first time or returning to a beloved passage, there is a place for you on this journey.</p>
          </article>
          <Link
            className="storybook-seal"
            href="/media/"
            aria-label="Explore Media: Faith, Hope, Love — Let the story light the way"
          >
            <span>Faith · Hope · Love</span>
            <BookOpen size={34} strokeWidth={1.2} aria-hidden="true" />
            <small>Let the story<br />light the way</small>
          </Link>
        </div>
      </section>

      <section className="mission-section" aria-labelledby="mission-title">
        <div className="mission-inner page-width">
          <div className="mission-art">
            <Image
              alt="A peaceful garden valley with flower-filled banks, waterfalls, and a sunlit river."
              className="mission-landscape"
              fill
              sizes="(max-width: 700px) calc(100vw - 36px), 390px"
              src={`${basePath}/images/mission-garden.png`}
            />
            <span className="mission-art-frame" aria-hidden="true" />
            <Sparkles className="mission-sparkle mission-sparkle-one" aria-hidden="true" size={19} />
            <Sparkles className="mission-sparkle mission-sparkle-two" aria-hidden="true" size={16} />
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

      <section className="invitation-section" aria-labelledby="invitation-title">
        <Image
          alt="The risen Jesus welcomes his followers at sunset as an angel opens the empty tomb."
          className="invitation-background"
          fill
          sizes="100vw"
          src={`${basePath}/images/resurrection-at-sunset.webp`}
        />
        <div className="invitation-shade" aria-hidden="true" />
        <div className="page-width invitation-content">
          <div className="invitation-heading">
            <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> BEGIN YOUR JOURNEY</p>
            <h2 id="invitation-title">Every Story Has a Purpose.<br /><em>Every Journey Begins Somewhere.</em></h2>
            <p>Explore animated episodes inspired by Scripture, discover the teachings of Jesus, and experience the greatest story ever told through a new visual perspective.</p>
          </div>
          <Link className="media-invitation" href="/media/">
            <span className="invitation-icon"><Heart size={22} strokeWidth={1.4} aria-hidden="true" /></span>
            <span className="invitation-text"><small>YOUR NEXT CHAPTER</small><strong>Explore Our Media</strong></span>
            <span className="invitation-arrow"><ArrowRight size={19} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>
    </main>
  );
}
