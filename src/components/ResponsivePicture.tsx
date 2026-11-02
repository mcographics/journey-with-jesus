import Image, { type ImageProps } from "next/image";

export type PictureCandidate = {
  src: string;
  width: number;
};

type ResponsivePictureProps = Omit<ImageProps, "src" | "srcSet" | "unoptimized"> & {
  fallbackSrc: string;
  webpSources: PictureCandidate[];
  mobileWebpSources?: PictureCandidate[];
  pictureClassName?: string;
};

function toSrcSet(candidates: PictureCandidate[]) {
  return candidates.map(({ src, width }) => `${src} ${width}w`).join(", ");
}

export default function ResponsivePicture({
  fallbackSrc,
  webpSources,
  mobileWebpSources,
  pictureClassName,
  alt,
  sizes,
  ...imageProps
}: ResponsivePictureProps) {
  return (
    <picture className={["responsive-picture", pictureClassName].filter(Boolean).join(" ")}>
      {mobileWebpSources?.length ? (
        <source
          media="(max-width: 700px)"
          type="image/webp"
          srcSet={toSrcSet(mobileWebpSources)}
          sizes="100vw"
        />
      ) : null}
      <source
        type="image/webp"
        srcSet={toSrcSet(webpSources)}
        sizes={sizes}
      />
      <Image {...imageProps} alt={alt} sizes={sizes} src={fallbackSrc} unoptimized />
    </picture>
  );
}
