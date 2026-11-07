import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, Compass, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Follow Kerygma Path's studio progress, creative process, project plans, and news.",
};

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
