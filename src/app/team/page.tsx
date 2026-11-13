import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { TeamDirectory } from "@/components/TeamDirectory";

export const metadata: Metadata = {
  title: "Meet the Christian Animation Team",
  description: "Meet the Kerygma Path creative team behind Journey with Jesus, a Christian animation project sharing Gospel stories and the life of Jesus Christ.",
  alternates: { canonical: "/team/" },
};

const fallbackMembers = [
  {
    id: "eric-oberhausen",
    name: "Eric Oberhausen",
    role: "Founder",
    bio: "Eric Oberhausen is the founder of Journey with Jesus, an animated storytelling project sharing Scripture and the life of Jesus.",
    role_fr: "Fondateur, animateur",
    bio_fr: "Eric Oberhausen est le fondateur de Kerygma Path et le créateur de Journey with Jesus, une série de récits animés assistés par l’IA qui donne vie aux Écritures et à la vie de Jésus.",
    role_es: "Fundador y animador",
    bio_es: "Eric Oberhausen es el fundador de Kerygma Path y creador de Journey with Jesus, una serie de relatos animados con ayuda de IA que da vida a las Escrituras y a la vida de Jesús.",
    profile_image_url: null,
    sort_order: 1,
  },
  {
    id: "kenneth-salmon",
    name: "Kenneth Salmon",
    role: "Editor / Webmaster",
    bio: "Kenneth Salmon serves as Editor / Webmaster, editing site content and maintaining Journey with Jesus online.",
    role_fr: "Rédacteur, webmestre",
    bio_fr: "Ken Salmon est rédacteur et webmestre pour Kerygma Path. Il supervise la révision du contenu, les mises à jour du site et la présence en ligne de la plateforme.",
    role_es: "Editor y webmaster",
    bio_es: "Ken Salmon es editor y webmaster de Kerygma Path. Supervisa la edición de contenido, las actualizaciones del sitio y la presencia en línea de la plataforma.",
    profile_image_url: null,
    sort_order: 2,
  },
];

export default function TeamPage() {
  return (
    <main className="editorial-page team-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><Sparkles aria-hidden="true" size={15} /> The people behind the project</p>
          <h1>Meet the <em>Team</em></h1>
          <p className="editorial-intro">A small creative team sharing the stories of Scripture through thoughtful design and animation.</p>
        </header>

        <TeamDirectory fallbackMembers={fallbackMembers} />
        <figure className="team-scripture">
          <blockquote>
            “Whatever you do [whatever your task may be], work from the soul [that is, put in your very best effort], as [something done] for the Lord and not for men,”
          </blockquote>
          <figcaption>Colossians 3:23 <span>(AMP)</span></figcaption>
          <p className="team-scripture-credit">
            Scripture quotations taken from the Amplified® Bible (AMP), Copyright © 2015 by The Lockman Foundation. Used by permission.{" "}
            <a href="https://www.lockman.org/" target="_blank" rel="noopener noreferrer">www.Lockman.org</a>
          </p>
        </figure>
      </div>
    </main>
  );
}
