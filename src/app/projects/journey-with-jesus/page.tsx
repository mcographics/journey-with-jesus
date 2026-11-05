import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";
import MastheadTicker from "@/components/MastheadTicker";
import XrayReveal from "@/components/XrayReveal";
import ResponsivePicture, { type PictureCandidate } from "@/components/ResponsivePicture";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const imageSources = (stem: string, widths: number[]): PictureCandidate[] =>
  widths.map((width) => ({
    src: `${basePath}/images/${stem}-${width}.webp`,
    width,
  }));

export const metadata: Metadata = {
  title: "Journey with Jesus — A Kerygma Path Project",
  description: "Discover Journey with Jesus, Kerygma Path's animated project sharing the life and message of Jesus Christ.",
  openGraph: {
    title: "Journey with Jesus — A Kerygma Path Project",
    description: "Discover Journey with Jesus, Kerygma Path's animated project sharing the life and message of Jesus Christ.",
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <XrayReveal
        canvasClassName="masthead-easter-egg-canvas xray-reveal-canvas"
        imageSrc={`${basePath}/images/header-easter-egg-2560.webp`}
      >
        <ResponsivePicture
          alt="Jesus walks with a young man beneath an autumn tree, overlooking a sunlit valley."
          className="home-masthead-image"
          height={2736}
          fallbackSrc={`${basePath}/images/journey-with-jesus-header-fallback.jpg`}
          fetchPriority="high"
          loading="eager"
          sizes="100vw"
          webpSources={imageSources("journey-with-jesus-header", [512, 768, 1024, 1440, 1920, 2560, 3200, 3840])}
          width={6384}
        />
        <Image
          alt="Journey with Jesus"
          className="home-masthead-wordmark"
          height={1556}
          loading="eager"
          src={`${basePath}/images/journey-with-jesus-wordmark.webp`}
          unoptimized
          width={4040}
        />
        <MastheadTicker />
      </XrayReveal>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content page-width">
          <p className="eyebrow"><span /> A KERYGMA PATH PROJECT</p>
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
        <ResponsivePicture
          alt=""
          aria-hidden="true"
          className="storybook-background"
          fill
          fallbackSrc={`${basePath}/images/scripture-city-story-fallback.jpg`}
          loading="lazy"
          pictureClassName="responsive-picture-fill"
          sizes="(max-width: 700px) 100vw, 130vw"
          webpSources={imageSources("scripture-city-story", [960, 1280, 1920, 2560, 3200, 3840])}
          mobileWebpSources={imageSources("scripture-city-story-mobile", [384, 576])}
        />
        <div className="storybook-shade" aria-hidden="true" />
        <div className="page-width storybook-layout">
          <article className="storybook-copy">
            <p className="storybook-eyebrow"><Sparkles size={15} aria-hidden="true" /><span>Our Story</span><i>01</i></p>
            <h2 className="storybook-title" id="scripture-title">Bringing Scripture to Life<em>One Story at a Time</em></h2>
            <div className="storybook-description-panel">
              <p className="storybook-lead">Every great journey begins with a story. This one leads to Jesus.</p>
              <p>The Bible is filled with unforgettable moments of courage, compassion, miracles, and hope. We bring these Scripture-rooted stories to life through vivid animation and heartfelt storytelling.</p>
              <p>Follow the journey of Jesus—from his teachings and miracles to the promise of resurrection—and discover the timeless message at the heart of every story.</p>
              <p>Whether you are opening Scripture for the first time or returning to a beloved passage, there is a place for you on this journey.</p>
            </div>
          </article>
          <Link
            className="storybook-seal"
            href="/media/"
            aria-label="Explore Media: Faith, Hope, Love — Let the story light the way. Click Me!"
          >
            <span>Faith · Hope · Love</span>
            <BookOpen size={34} strokeWidth={1.2} aria-hidden="true" />
            <small>Let the story<br />light the way</small>
            <strong className="storybook-seal-cta">Click Me!</strong>
          </Link>
        </div>
      </section>

      <section className="mission-section" aria-labelledby="mission-title">
        <div className="mission-inner page-width">
          <div className="mission-art">
            <ResponsivePicture
              alt="A peaceful garden valley with flower-filled banks, waterfalls, and a sunlit river."
              className="mission-landscape"
              fill
              fallbackSrc={`${basePath}/images/mission-garden-fallback.jpg`}
              loading="lazy"
              pictureClassName="responsive-picture-fill"
              sizes="(max-width: 700px) calc(100vw - 36px), 390px"
              webpSources={imageSources("mission-garden", [480, 640, 900])}
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
        <ResponsivePicture
          alt="The risen Jesus welcomes his followers at sunset as an angel opens the empty tomb."
          className="invitation-background"
          fill
          fallbackSrc={`${basePath}/images/resurrection-at-sunset-fallback.jpg`}
          loading="lazy"
          pictureClassName="responsive-picture-fill"
          sizes="(max-width: 700px) 100vw, 130vw"
          webpSources={imageSources("resurrection-at-sunset", [960, 1280, 1920, 2560, 3200, 3840])}
          mobileWebpSources={imageSources("resurrection-at-sunset-mobile", [400, 600, 790])}
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
