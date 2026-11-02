import type { Metadata } from "next";
import { Clapperboard, Feather, Sparkles } from "lucide-react";

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
            <div aria-hidden="true" className="team-art team-art-ken">
              <span className="team-art-label">Founder · Creative direction</span>
              <span className="team-monogram">KS</span>
              <Feather className="team-art-mark" size={27} strokeWidth={1.2} />
            </div>
            <div className="team-card-copy">
              <p className="team-role">Website · Creative direction</p>
              <h2>Ken</h2>
              <p>Ken created Journey with Jesus and shapes its visual direction, bringing his graphic design background to the way each story is shared.</p>
            </div>
          </article>

          <article className="team-card">
            <div aria-hidden="true" className="team-art team-art-animation">
              <span className="team-art-label">Animation · Visual storytelling</span>
              <Clapperboard className="team-animator-icon" size={58} strokeWidth={1.15} />
              <span className="team-animator-caption">Bringing each story to life</span>
            </div>
            <div className="team-card-copy">
              <p className="team-role">Animation</p>
              <h2>Our Animator</h2>
              <p>Our animation collaborator brings the characters and their stories to the screen through movement and visual storytelling.</p>
            </div>
          </article>
        </section>
        <p className="team-note">This project is made with care for the stories and the people who bring them to life.</p>
      </div>
    </main>
  );
}
