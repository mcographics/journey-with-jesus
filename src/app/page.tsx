import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      <Image
        alt=""
        aria-hidden="true"
        className="kerygma-gateway-image"
        fill
        priority
        sizes="100vw"
        src={`${basePath}/images/biblical-sunset-over-unbroken-valley.webp`}
        unoptimized
      />
      <div aria-hidden="true" className="kerygma-gateway-shade" />
      <div className="kerygma-gateway-content">
        <div aria-hidden="true" className="kerygma-emblem">K</div>
        <p className="kerygma-gateway-kicker">A Christian Animation Studio</p>
        <h1>Kerygma <em>Path</em></h1>
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
