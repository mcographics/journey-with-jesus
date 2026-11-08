"use client";

import { useSyncExternalStore } from "react";
import ResponsivePicture from "@/components/ResponsivePicture";

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
  const language = document.documentElement.lang.toLowerCase().split("-")[0];
  return language === "fr" || language === "es" ? language : "en";
}

function getServerLanguage() {
  return "en";
}

type LanguageAwareLogoProps = {
  alt: string;
  className: string;
  fetchPriority?: "high" | "low" | "auto";
  height: number;
  loading: "eager" | "lazy";
  pictureClassName: string;
  sizes: string;
  width: number;
};

export function LanguageAwareLogo(props: LanguageAwareLogoProps) {
  const language = useSyncExternalStore(
    subscribeToSiteLanguage,
    getSiteLanguage,
    getServerLanguage,
  );
  const imagePrefix = language === "fr"
    ? "kerygma-path-gateway-logo-fr"
    : language === "es"
      ? "kerygma-path-gateway-logo-es"
      : "kerygma-path-gateway-logo-complete";
  const imageFormat = language === "en" ? "webp" : "png";
  const logoSources = [480, 840].map((width) => ({
    src: `${basePath}/images/${imagePrefix}-${width}.${imageFormat}`,
    width,
  }));

  return (
    <ResponsivePicture
      {...props}
      fallbackSrc={`${basePath}/images/${imagePrefix}-840.${imageFormat}`}
      pngSources={imageFormat === "png" ? logoSources : undefined}
      webpSources={imageFormat === "webp" ? logoSources : undefined}
    />
  );
}
