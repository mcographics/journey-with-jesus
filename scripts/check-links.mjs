import { readdir, stat, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";

const exportRoot = resolve("out");
const siteOrigin = "https://kerygmapath.com";
let inspectedPages = 0;
let checkedReferences = 0;
const broken = [];

async function htmlFiles(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, item.name);
    if (item.isDirectory()) files.push(...await htmlFiles(absolutePath));
    else if (item.isFile() && item.name.endsWith(".html")) files.push(absolutePath);
  }
  return files;
}

async function checkReference(value, source) {
  if (!value || value.startsWith("#")) return;
  let url;
  try {
    url = new URL(value, siteOrigin + source);
  } catch {
    broken.push(source + ": invalid URL " + value);
    return;
  }
  if (url.origin !== siteOrigin) return;
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    broken.push(source + ": invalid URL encoding " + value);
    return;
  }
  const pathnameWithoutSlash = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const relativeTarget = extname(pathnameWithoutSlash)
    ? pathnameWithoutSlash.slice(1)
    : join(pathnameWithoutSlash.slice(1), "index.html");
  const fullPath = resolve(exportRoot, relativeTarget);
  if (!fullPath.startsWith(exportRoot + sep)) {
    broken.push(source + ": path escapes static export " + value);
    return;
  }
  checkedReferences += 1;
  try {
    if (!(await stat(fullPath)).isFile()) broken.push(source + ": not a file " + value);
  } catch {
    broken.push(source + ": missing " + value);
  }
}

const htmlPaths = await htmlFiles(exportRoot);
for (const htmlPath of htmlPaths) {
  inspectedPages += 1;
  const exportedPath = relative(exportRoot, htmlPath).split(sep).join("/");
  const pagePath = exportedPath === "index.html"
    ? "/"
    : "/" + exportedPath.replace(/index\.html$/, "");
  const { document } = new JSDOM(await readFile(htmlPath, "utf8")).window;
  for (const element of document.querySelectorAll("a[href], link[href], script[src], img[src], img[srcset], source[src], source[srcset]")) {
    const url = element.getAttribute("href") || element.getAttribute("src");
    if (url) await checkReference(url, pagePath);
    const srcSet = element.getAttribute("srcset");
    if (srcSet) {
      for (const entry of srcSet.split(",")) {
        const candidate = entry.trim().split(/\s+/)[0];
        if (candidate) await checkReference(candidate, pagePath);
      }
    }
  }
}
if (broken.length) {
  console.error("Static export link check found " + broken.length + " broken references:");
  broken.forEach((item) => console.error(" - " + item));
  process.exitCode = 1;
} else {
  console.log("Static export link check passed: " + inspectedPages + " HTML pages; " + checkedReferences + " internal links/assets.");
}
