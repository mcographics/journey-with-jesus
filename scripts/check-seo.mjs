import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const origin = "https://kerygmapath.com";
const paths = ["/", "/company/", "/projects/journey-with-jesus/", "/media/", "/blog/", "/characters/", "/word/", "/team/"];
const titles = new Set();
const descriptions = new Set();
for (const path of paths) {
  const { document } = new JSDOM(await readFile(`out${path}index.html`, "utf8")).window;
  const meta = (key) => document.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.content;
  const title = document.title;
  const description = meta("description");
  assert(title && description, `${path}: missing search metadata`);
  assert(!titles.has(title) && !descriptions.has(description), `${path}: duplicate search metadata`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, path);
  assert.equal(document.querySelector('link[rel="canonical"]').href, origin + path, path);
  assert.equal(meta("og:url"), origin + path, `${path}: incorrect social URL`);
  assert(meta("og:title") && meta("twitter:title"), `${path}: missing social metadata`);
  assert(!meta("robots")?.includes("noindex"), `${path}: public page excluded`);
  const graph = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((script) => JSON.parse(script.textContent)["@graph"] ?? []);
  const organization = graph.find((node) => node["@type"] === "Organization");
  const website = graph.find((node) => node["@type"] === "WebSite");
  assert(organization && website, `${path}: missing structured data`);
  assert.equal(website.publisher["@id"], organization["@id"], path);
}
const sitemap = await readFile("out/sitemap.xml", "utf8");
for (const path of paths) assert(sitemap.includes(`<loc>${origin}${path}</loc>`), path);
for (const path of ["/studio/", "/store/"]) {
  assert(!sitemap.includes(`<loc>${origin}${path}</loc>`), path);
  const { document } = new JSDOM(await readFile(`out${path}index.html`, "utf8")).window;
  assert(document.querySelector('meta[name="robots"]')?.content.includes("noindex"), path);
}
assert((await readFile("out/robots.txt", "utf8")).includes(`Sitemap: ${origin}/sitemap.xml`));
console.log(`SEO export checks passed: ${paths.length} public pages, structured data, sitemap, robots, Studio/store noindex.`);
