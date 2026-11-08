import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GreekStarfield } from "@/components/GreekStarfield";
import { LanguageAwareLogo } from "@/components/LanguageAwareLogo";

export const metadata: Metadata = {
  title: "Kerygma Path — Christian Animation Studio",
  description:
    "Kerygma Path is a Christian animation studio using AI and creative tools to bring Gospel-centered stories to life.",
  openGraph: {
    title: "Kerygma Path — Christian Animation Studio",
    description:
      "Stories of Scripture, brought to life through thoughtful Christian animation.",
  },
};

export default function HomePage() {
  return (
    <main className="kerygma-gateway" id="main-content">
      <GreekStarfield />
      <div className="visually-hidden">
        <p className="visually-hidden" lang="grc">Ἐν ἀρχῇ ἦν ὁ λόγος</p>
        <p className="kerygma-gateway-translation">“In the beginning was the Word.”</p>
        <cite className="kerygma-gateway-reference">John 1:1</cite>
      </div>
      <div className="kerygma-gateway-content">
        <p className="kerygma-gateway-kicker">A Christian Animation Studio</p>
        <h1 className="kerygma-gateway-logo-heading">
          <span className="visually-hidden">Kerygma Path</span>
          <LanguageAwareLogo
            alt=""
            className="kerygma-gateway-logo"
            height={724}
            fetchPriority="high"
            loading="eager"
            pictureClassName="kerygma-gateway-logo-picture"
            sizes="(max-width: 700px) min(68vw, 250px), 390px"
            width={2172}
          />
        </h1>
        <p className="kerygma-gateway-description">
          Scripture-rooted stories, brought to life through animation to share the Gospel.
        </p>
        <Link className="kerygma-enter-button" href="/company/">
          <span>Enter Site</span>
          <ArrowRight aria-hidden="true" size={19} />
        </Link>
        <p className="kerygma-gateway-note">Faith · Story · Animation</p>
      </div>
    </main>
  );
}
