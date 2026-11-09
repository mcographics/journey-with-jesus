import type { MetadataRoute } from "next";
import { legalPolicies } from "@/data/legal-policies";

const siteUrl = "https://kerygmapath.com";

export const dynamic = "force-static";

const publicPaths = [
  "/",
  "/blog/",
  "/characters/",
  "/company/",
  "/media/",
  "/projects/journey-with-jesus/",
  "/team/",
  "/word/",
  ...legalPolicies.map(({ slug }) => `/policies/${slug}/`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
