import type { Metadata } from "next";
import { EnterSiteLink } from "@/components/EnterSiteLink";
import { GreekStarfield } from "@/components/GreekStarfield";
import { LanguageAwareLogo } from "@/components/LanguageAwareLogo";

export const metadata: Metadata = {
  title: { absolute: "Kerygma Path | Christian Animation & Gospel Stories" },
  description:
    "Kerygma Path is a Christian animation studio creating Scripture-rooted Gospel stories through animation and AI-assisted creative tools. Discover Journey with Jesus.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kerygma Path | Christian Animation & Gospel Stories",
    description:
      "Discover Journey with Jesus and AI-assisted Christian animation inspired by Scripture and the Gospel.",
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
          Kerygma Path brings the Gospel and the life of Jesus Christ to the screen through Scripture-rooted Christian animation and AI-assisted storytelling.
        </p>
        <EnterSiteLink />
        <p className="kerygma-gateway-note">Faith · Story · Animation</p>
      </div>
    </main>
  );
}
