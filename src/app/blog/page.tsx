import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, Compass, Sparkles, Users } from "lucide-react";

export const metadata = pageMetadata(
  "Studio Blog — Christian Animation & AI",
  "Follow Kerygma Path news, Journey with Jesus development, Christian animation, AI-assisted storytelling and the creative process behind Gospel stories.",
  "/blog/",
);

const updateTopics = [
  {
    icon: Clapperboard,
    title: "Project progress",
    description: "Follow the development of Journey with Jesus and the stories taking shape at Kerygma Path.",
  },
  {
    icon: Sparkles,
    title: "Creative process",
    description: "Get a look at the writing, visual development, animation, and tools behind the work.",
  },
  {
    icon: Compass,
    title: "What’s ahead",
    description: "See what we’re planning, what we’re learning, and where the studio hopes to go next.",
  },
];

export default function BlogPage() {
  return (
    <main className="blog-page" id="main-content">
      <div className="blog-container">
        <header className="blog-hero">
          <p className="blog-eyebrow"><span /> Updates from Kerygma Path</p>
          <h1>Stories from <em>the studio.</em></h1>
          <p className="blog-intro">
            Follow our progress, discover how each project is taking shape, and hear what we’re planning next.
          </p>
        </header>

        <article aria-labelledby="blog-maintenance-title" className="blog-welcome blog-maintenance-post" id="maintenance-2026-11-17">
          <div aria-hidden="true" className="blog-welcome-mark"><Sparkles size={25} strokeWidth={1.5} /></div>
          <div className="blog-welcome-copy">
            <p className="blog-post-kicker"><time dateTime="2026-11-17">November 17, 2026</time> · Website update</p>
            <h2 id="blog-maintenance-title">Website maintenance: stronger checks, clearer links, and dependable publishing</h2>
            <p>
              We have completed a new maintenance pass on the Kerygma Path website. Our goal is straightforward:
              make it easier to explore our work, keep the site reliable across devices, and catch problems before
              future changes reach visitors.
            </p>
            <p>
              <strong>Recent footer improvements.</strong> The Journey with Jesus project title now links directly
              to its project page, the Majestic Creations credit opens the current studio website, and the
              Cloudflare and Aikido security credits have been refined for desktop and mobile. We also improved
              the contrast of the Aikido attribution in light mode while preserving its dark-mode appearance.
              GitHub Pages successfully deployed these changes on November 17.
            </p>
            <p>
              <strong>Pages, links, and search visibility.</strong> We reviewed the site&apos;s public routes and
              navigation, including the Company, Blog, Contact, Media, Characters, Team, Scripture reader,
              project, and policy pages. The Contact page is now included in the XML sitemap and SEO checks.
              A new release check inspects exported pages for broken internal links and missing local assets
              before publication, alongside existing page metadata and search-engine checks.
            </p>
            <p>
              <strong>Quality checks and accessibility.</strong> The publishing pipeline runs linting, type
              checking, unit tests, browser-based interaction tests, production builds, and SEO validation.
              These checks cover important responsive and accessible interactions, such as navigation,
              footer controls, and newsletter behaviour. We also clarified the development documentation
              to use the site&apos;s current domain for the private Studio.
            </p>
            <p>
              <strong>Behind the scenes.</strong> We checked the connected content database and its running
              functions for media, comments, contact inquiries, and newsletter forms. We reviewed database
              access rules and security and performance advisories without changing visitor information or
              altering moderation records. Some optional security settings and database optimizations remain
              under review rather than being described as resolved.
            </p>
            <p>
              <strong>What we are still monitoring.</strong> Automated checks can catch many problems, but
              they cannot replace live checks of third-party destinations, real-device loading performance,
              and every network condition. We will continue to review those areas as the studio grows.
              Thank you for following Kerygma Path and <em>Journey with Jesus</em>.
            </p>
            <Link className="blog-studio-link" href="/contact/">
              <span>Questions or feedback? Contact the studio</span><ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </article>

        <article aria-labelledby="blog-welcome-title" className="blog-welcome">
          <div aria-hidden="true" className="blog-welcome-mark"><BookOpen size={25} strokeWidth={1.5} /></div>
          <div className="blog-welcome-copy">
            <p className="blog-post-kicker">A note from the studio</p>
            <h2 id="blog-welcome-title">Welcome to the Kerygma Path blog</h2>
            <p>
              Kerygma Path is a Christian animation studio creating Scripture-rooted stories to share the Gospel. This is where we’ll post news from the studio, share the progress behind our projects, and let you know what we’re working toward.
            </p>
            <p>
              Our first project is <em>Journey with Jesus</em>. As it develops, we’ll bring you updates from the creative process and the plans shaping what comes next.
            </p>
          </div>
        </article>

        <article aria-labelledby="blog-community-title" className="blog-welcome blog-community-post">
          <div aria-hidden="true" className="blog-welcome-mark"><Users size={25} strokeWidth={1.5} /></div>
          <div className="blog-welcome-copy">
            <p className="blog-post-kicker">Community update</p>
            <h2 id="blog-community-title">Growing a community together</h2>
            <p>
              Kerygma Path now has a Facebook Group: a place for people who care about faith-centered animation and storytelling to connect, follow studio updates, and be part of the journey as our projects grow. We’re building this community so the conversation can grow alongside the creative work.
            </p>
            <a
              className="blog-studio-link"
              href="https://www.facebook.com/groups/kerygmapath"
              target="_blank"
              rel="noreferrer"
            >
              Visit the Kerygma Path Facebook Group <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
        </article>

        <section aria-labelledby="blog-topics-title" className="blog-topics-section">
          <div className="blog-section-heading">
            <p className="blog-eyebrow"><span /> Follow the journey</p>
            <h2 id="blog-topics-title">What you’ll find here</h2>
          </div>
          <div className="blog-topics-grid">
            {updateTopics.map(({ icon: Icon, title, description }, index) => (
              <article className="blog-topic-card" key={title}>
                <span aria-hidden="true" className="blog-topic-number">0{index + 1}</span>
                <Icon aria-hidden="true" size={23} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="blog-next-note">
          <p className="blog-post-kicker">More updates are on the way</p>
          <p>Keep checking back for studio news, project progress, and community updates as Kerygma Path grows.</p>
          <Link className="blog-studio-link" href="/company/">
            <span>Explore the Studio</span><ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}
