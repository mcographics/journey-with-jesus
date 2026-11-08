"use client";

import { useSyncExternalStore } from "react";
import ResponsivePicture from "@/components/ResponsivePicture";
import type { PictureCandidate } from "@/components/ResponsivePicture";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function subscribeToSiteLanguage(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  return () => observer.disconnect();
}

function getSiteLanguage() {
  return document.documentElement.lang.toLowerCase().split("-")[0];
}

function getServerLanguage() {
  return "en";
}

function imageSources(stem: string, widths: number[], extension: "png" | "webp"): PictureCandidate[] {
  return widths.map((width) => ({
    src: `${basePath}/images/${stem}-${width}.${extension}`,
    width,
  }));
}

export function LanguageAwareJourneyWordmark() {
  const language = useSyncExternalStore(
    subscribeToSiteLanguage,
    getSiteLanguage,
    getServerLanguage,
  );
  const isFrench = language === "fr";
  const isSpanish = language === "es";
  const wordmark = isFrench ? "journey-with-jesus-wordmark-fr" : "journey-with-jesus-wordmark";
  const extension = isFrench ? "png" : "webp";
  const sources = imageSources(wordmark, [320, 640, 960], extension);

  return (
    <ResponsivePicture
      alt={isFrench ? "Voyage avec Jésus" : isSpanish ? "Viaje con Jesús" : "Journey with Jesus"}
      className="home-masthead-wordmark-image"
      height={770}
      fetchPriority="high"
      fallbackSrc={`${basePath}/images/${wordmark}-960.${extension}`}
      loading="eager"
      pictureClassName="home-masthead-wordmark"
      sizes="(max-width: 700px) min(38vw, 154px), min(34vw, 460px)"
      pngSources={isFrench ? sources : undefined}
      webpSources={isFrench ? undefined : sources}
      width={2000}
    />
  );
}
