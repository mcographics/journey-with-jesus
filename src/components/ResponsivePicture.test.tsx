import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResponsivePicture from "./ResponsivePicture";

const candidate = [{ src: "/images/example-480.avif", width: 480 }];

describe("ResponsivePicture", () => {
  it("prefers responsive AVIF sources while retaining the WebP fallback", () => {
    const { container } = render(
      <ResponsivePicture
        alt="Example"
        avifSources={candidate}
        fallbackSrc="/images/example-fallback.jpg"
        height={240}
        mobileAvifSources={candidate}
        mobileWebpSources={[{ src: "/images/example-mobile-480.webp", width: 480 }]}
        sizes="100vw"
        webpSources={[{ src: "/images/example-480.webp", width: 480 }]}
        width={480}
      />,
    );

    const sources = [...container.querySelectorAll<HTMLSourceElement>("picture > source")];
    expect(sources.map((source) => source.type)).toEqual([
      "image/avif",
      "image/webp",
      "image/avif",
      "image/webp",
    ]);
    expect(sources[0].media).toBe("(max-width: 700px)");
    expect(container.querySelector("picture > img")?.getAttribute("src")).toBe(
      "/images/example-fallback.jpg",
    );
  });

  it("keeps the existing source behavior when AVIF is not configured", () => {
    const { container } = render(
      <ResponsivePicture
        alt="Example"
        fallbackSrc="/images/example-fallback.jpg"
        height={240}
        sizes="100vw"
        webpSources={[{ src: "/images/example-480.webp", width: 480 }]}
        width={480}
      />,
    );

    expect(container.querySelector('source[type="image/avif"]')).toBeNull();
    expect(container.querySelector('source[type="image/webp"]')?.getAttribute("srcset")).toBe(
      "/images/example-480.webp 480w",
    );
    expect(container.querySelector("picture > img")?.getAttribute("src")).toBe(
      "/images/example-fallback.jpg",
    );
  });
});
