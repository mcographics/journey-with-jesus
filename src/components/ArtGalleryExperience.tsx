"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import styles from "./ArtGalleryExperience.module.css";

type GalleryRow = Database["public"]["Tables"]["art_gallery_images"]["Row"];
type GalleryArtwork = GalleryRow & { imageUrl: string };
const GALLERY_BUCKET = "journey-art-gallery";

export function ArtGalleryExperience() {
  const [artwork, setArtwork] = useState<GalleryArtwork[]>([]);
  const [category, setCategory] = useState("All Art");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadGallery() {
      const client = createBrowserSupabaseClient();
      if (!client) {
        if (active) {
          setLoadError("The gallery is temporarily unavailable.");
          setLoading(false);
        }
        return;
      }
      try {
        const { data, error } = await client
          .from("art_gallery_images")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        const signedArtwork = await Promise.all((data ?? []).map(async (item) => {
          const { data: signed, error: signedError } = await client.storage
            .from(GALLERY_BUCKET)
            .createSignedUrl(item.storage_path, 1800);
          if (signedError || !signed?.signedUrl) return null;
          return { ...item, imageUrl: signed.signedUrl };
        }));
        if (active) {
          setArtwork(signedArtwork.filter((item): item is GalleryArtwork => Boolean(item)));
          setLoadError("");
        }
      } catch {
        if (active) setLoadError("The gallery could not be loaded. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadGallery();
    return () => { active = false; };
  }, []);

  const categories = useMemo(
    () => ["All Art", ...Array.from(new Set(artwork.map((item) => item.category).filter(Boolean)))],
    [artwork],
  );
  const visibleArtwork = useMemo(
    () => category === "All Art" ? artwork : artwork.filter((item) => item.category === category),
    [artwork, category],
  );
  const currentIndex = visibleArtwork.length ? activeIndex % visibleArtwork.length : 0;
  const current = visibleArtwork[currentIndex]!;
  const previous = visibleArtwork.length > 1
    ? visibleArtwork[(currentIndex + visibleArtwork.length - 1) % visibleArtwork.length]
    : undefined;
  const next = visibleArtwork.length > 1
    ? visibleArtwork[(currentIndex + 1) % visibleArtwork.length]
    : undefined;

  const move = useCallback((amount: number) => {
    setActiveIndex((index) => visibleArtwork.length
      ? (index + amount + visibleArtwork.length) % visibleArtwork.length
      : 0);
  }, [visibleArtwork.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <>
      <main
      id="main-content"
      className={styles.page}
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onKeyDownCapture={(event) => {
        if ((event.ctrlKey || event.metaKey) && ["s"].includes(event.key.toLowerCase())) {
          event.preventDefault();
        }
      }}
    >
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>JOURNEY WITH JESUS <span /> VISUAL COLLECTION</p>
          <h1>Art Gallery</h1>
          <p className={styles.intro}>A visual journey through Scripture, brought to life by the Journey with Jesus creative team.</p>
        </header>

        {loading ? (
          <div className={styles.message} role="status">
            <span className={styles.loader} aria-hidden="true" />
            <p>Loading the gallery…</p>
          </div>
        ) : loadError ? (
          <div className={styles.message} role="status"><Images size={30} aria-hidden="true" /><p>{loadError}</p></div>
        ) : visibleArtwork.length === 0 ? (
          <section className={styles.empty} aria-labelledby="gallery-empty-title">
            <span className={styles.emptyIcon}><Images size={28} aria-hidden="true" /></span>
            <p className={styles.emptyKicker}>A NEW COLLECTION IS TAKING SHAPE</p>
            <h2 id="gallery-empty-title">Artwork will appear here soon.</h2>
            <p>New scenes, characters, and moments from Journey with Jesus will be added to this gallery.</p>
          </section>
        ) : (
          <>
            <div className={styles.categoryBar} aria-label="Filter artwork by category">
              {categories.map((item) => (
                <button
                  aria-pressed={category === item}
                  className={category === item ? styles.categoryActive : ""}
                  key={item}
                  onClick={() => { setCategory(item); setActiveIndex(0); }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <section className={styles.carousel} aria-label="Journey with Jesus art gallery">
              <div className={styles.stage} aria-roledescription="carousel">
                {previous && (
                  <button className={[styles.peek, styles.previousPeek].join(" ")} onClick={() => move(-1)} type="button" aria-label={"Show " + previous.title}>
                    <img src={previous.imageUrl} alt="" draggable={false} />
                  </button>
                )}
                <figure className={styles.featured}>
                  <button className={styles.featuredImage} onClick={() => setLightboxOpen(true)} type="button" aria-label={"Open artwork: " + current.title}>
                    <img src={current.imageUrl} alt="" draggable={false} fetchPriority="high" />
                    <span className={styles.expand}><Expand size={17} aria-hidden="true" /> View image</span>
                  </button>
                  <figcaption className={styles.caption}>
                    <div>
                      <span className={styles.artCategory}>{current.category}</span>
                      <h2>{current.title}</h2>
                      {current.description && <p>{current.description}</p>}
                    </div>
                    <span className={styles.imageCount}>{String(currentIndex + 1).padStart(2, "0")} / {String(visibleArtwork.length).padStart(2, "0")}</span>
                  </figcaption>
                </figure>
                {next && (
                  <button className={[styles.peek, styles.nextPeek].join(" ")} onClick={() => move(1)} type="button" aria-label={"Show " + next.title}>
                    <img src={next.imageUrl} alt="" draggable={false} />
                  </button>
                )}
                {visibleArtwork.length > 1 && (
                  <>
                    <button className={[styles.arrow, styles.previousArrow].join(" ")} onClick={() => move(-1)} type="button" aria-label="Previous artwork"><ChevronLeft size={23} aria-hidden="true" /></button>
                    <button className={[styles.arrow, styles.nextArrow].join(" ")} onClick={() => move(1)} type="button" aria-label="Next artwork"><ChevronRight size={23} aria-hidden="true" /></button>
                  </>
                )}
              </div>

              <div className={styles.carouselControls}>
                <span className={styles.currentNumber}>{String(currentIndex + 1).padStart(2, "0")}</span>
                <div className={styles.progress} aria-hidden="true"><span style={{ width: ((currentIndex + 1) / visibleArtwork.length * 100) + "%" }} /></div>
                <span className={styles.totalNumber}>{String(visibleArtwork.length).padStart(2, "0")}</span>
              </div>

              <div className={styles.thumbnails} aria-label="Choose artwork">
                {visibleArtwork.map((item, index) => (
                  <button
                    aria-current={index === currentIndex ? "true" : undefined}
                    aria-label={"Show " + item.title}
                    className={index === currentIndex ? styles.thumbnailActive : ""}
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <img src={item.imageUrl} alt="" draggable={false} loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        <p className={styles.rightsNote}>Please respect the artwork and its creators. Gallery images are watermarked; the site can discourage saving, but screenshot shortcuts are controlled by your device and cannot be reliably disabled here.</p>
      </div>

    </main>
      {lightboxOpen && current && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setLightboxOpen(false)}>
          <div className={styles.lightboxArtwork} onClick={(event) => event.stopPropagation()}>
            <button className={styles.closeLightbox} type="button" aria-label="Close artwork view" onClick={() => setLightboxOpen(false)}><X size={22} aria-hidden="true" /></button>
            <img src={current.imageUrl} alt={current.title} draggable={false} />
          </div>
          <p>{current.title}</p>
        </div>
      )}
    </>
  );
}
