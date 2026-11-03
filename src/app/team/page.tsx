import type { Metadata } from "next";
import { Feather, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet the Team",
  description: "Meet the people bringing Journey with Jesus to life.",
};

export default function TeamPage() {
  return (
    <main className="editorial-page team-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><Sparkles aria-hidden="true" size={15} /> The people behind the project</p>
          <h1>Meet the <em>Team</em></h1>
          <p className="editorial-intro">A small creative team sharing the stories of Scripture through thoughtful design and animation.</p>
        </header>

        <section aria-label="Journey with Jesus team" className="team-grid">
          <article className="team-card">
            <div aria-hidden="true" className="team-art team-art-eric">
              <span className="team-art-label">Founder</span>
              <span className="team-monogram">EO</span>
              <Sparkles className="team-art-mark" size={27} strokeWidth={1.2} />
            </div>
            <div className="team-card-copy">
              <p className="team-role">Founder</p>
              <h2>Eric Oberhausen</h2>
              <p>Eric Oberhausen is the founder of Journey with Jesus, an animated storytelling project sharing Scripture and the life of Jesus.</p>
            </div>
          </article>

          <article className="team-card">
            <div aria-hidden="true" className="team-art team-art-kenneth">
              <span className="team-art-label">Editing · Website</span>
              <span className="team-monogram">KS</span>
              <Feather className="team-art-mark" size={27} strokeWidth={1.2} />
            </div>
            <div className="team-card-copy">
              <p className="team-role">Editor / Webmaster</p>
              <h2>Kenneth Salmon</h2>
              <p>Kenneth Salmon serves as Editor / Webmaster, editing site content and maintaining Journey with Jesus online.</p>
            </div>
          </article>
        </section>
        <p className="team-note">This project is made with care for the stories and the people who bring them to life.</p>
      </div>
    </main>
  );
}
