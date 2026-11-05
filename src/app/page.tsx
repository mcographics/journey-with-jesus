import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GreekStarfield } from "@/components/GreekStarfield";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
          <Image
            alt=""
            className="kerygma-gateway-logo"
            height={1086}
            priority
            sizes="(max-width: 700px) 78vw, 390px"
            src={`${basePath}/images/kerygma-path-gateway-logo.png`}
            unoptimized
            width={1448}
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
