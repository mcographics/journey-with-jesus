"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { BIBLE_CHARACTER_NAMES, isBibleCharacterName } from "@/lib/art-gallery-characters";
import {
  getAvailableGalleryCategories,
  getGalleryCategorySection,
  type GalleryCategorySection,
} from "@/lib/art-gallery-categories";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import styles from "./ArtGalleryExperience.module.css";

type GalleryRow = Database["public"]["Tables"]["art_gallery_images"]["Row"];
type GalleryArtwork = GalleryRow & { imageUrl: string };
const GALLERY_BUCKET = "journey-art-gallery";
const UNASSIGNED_CHARACTER_FILTER = "__unassigned__";

export function ArtGalleryExperience() {
  const [artwork, setArtwork] = useState<GalleryArtwork[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategorySection | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOpen, setCarouselOpen] = useState(false);
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

  const categories = useMemo(() => getAvailableGalleryCategories(artwork), [artwork]);
  const availableCharacters = useMemo(() => {
    const publishedCharacterNames = new Set(
      artwork
        .filter((item) => getGalleryCategorySection(item.category) === "Characters")
        .map((item) => item.character_name)
        .filter((name): name is string => isBibleCharacterName(name)),
    );
    return BIBLE_CHARACTER_NAMES.filter((name) => publishedCharacterNames.has(name));
  }, [artwork]);
  const hasUnassignedCharacterArtwork = useMemo(
    () => artwork.some((item) =>
      getGalleryCategorySection(item.category) === "Characters" && !isBibleCharacterName(item.character_name),
    ),
    [artwork],
  );
  const visibleArtwork = useMemo(() => {
    if (!selectedCategory) return [];
    const categoryArtwork = artwork.filter((item) => getGalleryCategorySection(item.category) === selectedCategory);
    if (selectedCategory !== "Characters" || !selectedCharacter) return categoryArtwork;
    return categoryArtwork.filter((item) => selectedCharacter === UNASSIGNED_CHARACTER_FILTER
      ? !isBibleCharacterName(item.character_name)
      : item.character_name === selectedCharacter);
  }, [artwork, selectedCategory, selectedCharacter]);
  const current = visibleArtwork[activeIndex] ?? null;
  const previous = visibleArtwork.length > 1
    ? visibleArtwork[(activeIndex + visibleArtwork.length - 1) % visibleArtwork.length]
    : undefined;
  const next = visibleArtwork.length > 1
    ? visibleArtwork[(activeIndex + 1) % visibleArtwork.length]
    : undefined;

  const move = useCallback((amount: number) => {
    setActiveIndex((index) => visibleArtwork.length
      ? (index + amount + visibleArtwork.length) % visibleArtwork.length
      : 0);
  }, [visibleArtwork.length]);

  useEffect(() => {
    const preventSaveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", preventSaveShortcut, true);
    return () => window.removeEventListener("keydown", preventSaveShortcut, true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (carouselOpen && event.key === "ArrowLeft") move(-1);
      if (carouselOpen && event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carouselOpen, move]);

  function chooseCategory(category: GalleryCategorySection) {
    setSelectedCategory(category);
    setSelectedCharacter("");
    setActiveIndex(0);
    setCarouselOpen(false);
    setLightboxOpen(false);
  }

  function returnToCategories() {
    setSelectedCategory(null);
    setSelectedCharacter("");
    setActiveIndex(0);
    setCarouselOpen(false);
    setLightboxOpen(false);
  }

  function openArtwork(index: number) {
    setActiveIndex(index);
    setCarouselOpen(true);
  }

  return (
    <div
      className={styles.galleryShell}
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <main id="main-content" className={styles.page}>
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
          ) : artwork.length === 0 ? (
            <section className={styles.empty} aria-labelledby="gallery-empty-title">
              <span className={styles.emptyIcon}><Images size={28} aria-hidden="true" /></span>
              <p className={styles.emptyKicker}>A NEW COLLECTION IS TAKING SHAPE</p>
              <h2 id="gallery-empty-title">Artwork will appear here soon.</h2>
              <p>New scenes, characters, and moments from Journey with Jesus will be added to this gallery.</p>
            </section>
          ) : !selectedCategory ? (
            <section className={styles.categoryOverview} aria-label="Browse categories">
              <div className={styles.overviewHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>VISUAL COLLECTION</p>
                  <h2>Browse categories</h2>
                </div>
              </div>
              <div className={styles.categoryCards}>
                {categories.map((section) => {
                  const cover = artwork.find((item) => getGalleryCategorySection(item.category) === section);
                  const count = artwork.filter((item) => getGalleryCategorySection(item.category) === section).length;
                  if (!cover) return null;
                  return (
                    <button
                      className={styles.categoryCard}
                      key={section}
                      type="button"
                      aria-label={section}
                      onClick={() => chooseCategory(section)}
                    >
                      <span className={styles.categoryCover}>
                        <img src={cover.imageUrl} alt="" draggable={false} loading="lazy" />
                        <span className={styles.categoryShade} aria-hidden="true" />
                        <span className={styles.categoryContent}>
                          <span className={styles.categoryName}>{section}</span>
                          <span className={styles.categoryDetails}>
                            <span>{count}</span> <span>artworks</span>
                          </span>
                          <span className={styles.categoryExplore}>Explore this collection</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className={styles.collection} aria-label="Gallery collection">
              <nav className={styles.categoryNavigation} aria-label="Gallery categories">
                <button className={styles.backButton} type="button" onClick={returnToCategories}>
                  <ChevronLeft size={17} aria-hidden="true" />
                  Browse categories
                </button>
                <div className={styles.categoryBar}>
                  {categories.map((section) => (
                    <button
                      aria-pressed={selectedCategory === section}
                      className={selectedCategory === section ? styles.categoryActive : ""}
                      key={section}
                      onClick={() => chooseCategory(section)}
                      type="button"
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </nav>
              {selectedCategory === "Characters" && (
                <div className={styles.characterFilterRow}>
                  <label className={styles.characterFilter}>
                    <span>Filter by character</span>
                    <select
                      aria-label="Filter by character"
                      value={selectedCharacter}
                      onChange={(event) => {
                        setSelectedCharacter(event.target.value);
                        setActiveIndex(0);
                        setCarouselOpen(false);
                        setLightboxOpen(false);
                      }}
                    >
                      <option value="">All characters</option>
                      {availableCharacters.map((name) => <option key={name} value={name}>{name}</option>)}
                      {hasUnassignedCharacterArtwork && <option value={UNASSIGNED_CHARACTER_FILTER}>Unassigned</option>}
                    </select>
                  </label>
                </div>
              )}

              <div className={styles.collectionHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>VISUAL COLLECTION</p>
                  <h2>{selectedCategory}</h2>
                  <p className={styles.collectionCount}><span>{visibleArtwork.length}</span> <span>artworks</span></p>
                </div>
                {carouselOpen && (
                  <button className={styles.backButton} type="button" onClick={() => setCarouselOpen(false)}>
                    <ChevronLeft size={17} aria-hidden="true" />
                    Back to collection
                  </button>
                )}
              </div>

              {!carouselOpen ? (
                <section className={styles.artworkGrid} aria-label="Artwork in this collection">
                  {visibleArtwork.map((item, index) => (
                    <button
                      className={styles.artworkTile}
                      key={item.id}
                      type="button"
                      aria-label={item.title}
                      onClick={() => openArtwork(index)}
                    >
                      <span className={styles.artworkImage}>
                        <img src={item.imageUrl} alt="" draggable={false} loading="lazy" />
                        <span className={styles.tileExpand}><Expand size={16} aria-hidden="true" /> View image</span>
                      </span>
                      {item.character_name && <span className={styles.artworkCharacter}>{item.character_name}</span>}
                      <span className={styles.artworkTitle}>{item.title}</span>
                      {item.description && <span className={styles.artworkDescription}>{item.description}</span>}
                    </button>
                  ))}
                </section>
              ) : current ? (
                <section className={styles.carousel} aria-label="Journey with Jesus art gallery">
                  <div className={styles.stage} aria-roledescription="carousel">
                    {previous && (
                      <button className={[styles.peek, styles.previousPeek].join(" ")} onClick={() => move(-1)} type="button" aria-label="Previous artwork">
                        <img src={previous.imageUrl} alt="" draggable={false} />
                      </button>
                    )}
                    <figure className={styles.featured}>
                      <button className={styles.featuredImage} onClick={() => setLightboxOpen(true)} type="button" aria-label="View image">
                        <img src={current.imageUrl} alt="" draggable={false} fetchPriority="high" />
                        <span className={styles.expand}><Expand size={17} aria-hidden="true" /> View image</span>
                      </button>
                      <figcaption className={styles.caption}>
                        <div>
                          <span className={styles.artCategory}>{getGalleryCategorySection(current.category)}{current.character_name ? " · " + current.character_name : ""}</span>
                          <h2>{current.title}</h2>
                          {current.description && <p>{current.description}</p>}
                        </div>
                        <span className={styles.imageCount}>{String(activeIndex + 1).padStart(2, "0")} / {String(visibleArtwork.length).padStart(2, "0")}</span>
                      </figcaption>
                    </figure>
                    {next && (
                      <button className={[styles.peek, styles.nextPeek].join(" ")} onClick={() => move(1)} type="button" aria-label="Next artwork">
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
                    <span className={styles.currentNumber}>{String(activeIndex + 1).padStart(2, "0")}</span>
                    <div className={styles.progress} aria-hidden="true"><span style={{ width: (activeIndex + 1) / visibleArtwork.length * 100 + "%" }} /></div>
                    <span className={styles.totalNumber}>{String(visibleArtwork.length).padStart(2, "0")}</span>
                  </div>

                  <div className={styles.thumbnails} aria-label="Choose artwork">
                    {visibleArtwork.map((item, index) => (
                      <button
                        aria-current={index === activeIndex ? "true" : undefined}
                        aria-label={item.title}
                        className={index === activeIndex ? styles.thumbnailActive : ""}
                        key={item.id}
                        onClick={() => setActiveIndex(index)}
                        type="button"
                      >
                        <img src={item.imageUrl} alt="" draggable={false} loading="lazy" />
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          )}
          <p className={styles.rightsNote}>Gallery images are watermarked. Please respect the artwork and its creators; screenshot shortcuts are controlled by your device and cannot be disabled by this site.</p>
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
    </div>
  );
}
