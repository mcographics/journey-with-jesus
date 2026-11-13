import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GreekStarfield } from "@/components/GreekStarfield";
import { LanguageAwareLogo } from "@/components/LanguageAwareLogo";

export const metadata: Metadata = {
  title: { absolute: "Kerygma Path | Christian Animation & Bible Stories" },
  description:
    "Discover Christian animation and AI-assisted animated Bible stories about Jesus Christ at Kerygma Path, sharing the Gospel through Scripture-rooted storytelling.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kerygma Path | Christian Animation & Bible Stories",
    description:
      "Christian animation and AI-assisted Bible storytelling about Jesus Christ and the Gospel.",
    url: "/",
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
          <span className="kerygma-gateway-logo-stack">
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
            <span aria-hidden="true" className="kerygma-gateway-logo-trace">
              <LanguageAwareLogo
                alt=""
                className="kerygma-gateway-logo-trace-image"
                height={724}
                loading="eager"
                pictureClassName="kerygma-gateway-logo-picture kerygma-gateway-logo-trace-picture"
                sizes="(max-width: 700px) min(68vw, 250px), 390px"
                width={2172}
              />
            </span>
          </span>
        </h1>
        <p className="kerygma-gateway-description">
          Christian animation and AI-assisted Bible stories, bringing the Gospel of Jesus to life.
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
