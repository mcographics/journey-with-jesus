"use client";

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Minus, Plus, Search } from "lucide-react";

type BibleBook = {
  name: string;
  chapters: string[][];
};

type BibleSource = {
  name: string;
  url: string;
  license: string;
  attribution?: string;
};

type BibleData = {
  translation: string;
  language?: string;
  languageCode?: string;
  direction?: "ltr" | "rtl";
  source?: BibleSource;
  books: BibleBook[];
  redLetterSegments: Record<string, Array<[number, number]>>;
};

type SearchResult = {
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
  redSegments: Array<[number, number]>;
};

type SavedLocation = {
  bookName: string;
  chapter: number;
};

const readingLocationKey = "journey-with-jesus-word-location";
const maximumSearchResults = 50;
const translations = [
  { id: "KJV", label: "King James Version", language: "English", file: "kjv.json" },
  { id: "AKJV", label: "American King James Version", language: "English", file: "akjv.json" },
  { id: "ASV", label: "American Standard Version", language: "English", file: "asv.json" },
  { id: "DBT", label: "Darby Translation", language: "English", file: "dbt.json" },
  { id: "DRB", label: "Douay-Rheims Bible", language: "English", file: "drb.json" },
  { id: "ERV", label: "English Revised Version", language: "English", file: "erv.json" },
  { id: "GEN", label: "Geneva Bible (1560)", language: "English", file: "geneva-1560.json" },
  { id: "JPS", label: "JPS Tanakh 1917 (Old Testament)", language: "English", file: "jps.json" },
  { id: "SLT", label: "Smith's Literal Translation", language: "English", file: "slt.json" },
  { id: "WBT", label: "Webster's Bible Translation", language: "English", file: "wbt.json" },
  { id: "YLT", label: "Young's Literal Translation", language: "English", file: "ylt.json" },
  { id: "BLB", label: "Berean Literal Bible (New Testament)", language: "English", file: "blb.json" },
  { id: "BIB", label: "Berean Interlinear Bible (New Testament)", language: "English", file: "bib.json" },
  { id: "WEBU", label: "World English Bible Updated", language: "English", file: "web-updated.json" },
  { id: "BBE", label: "Bible in Basic English", language: "English", file: "bbe.json" },
  { id: "RV1909", label: "Reina-Valera 1909", language: "Spanish", file: "rv1909.json" },
  { id: "SBLM", label: "Spanish Free Bible for the World (draft)", language: "Spanish", file: "spablm.json" },
  { id: "SPBES", label: "La Biblia en Español Sencillo (2026)", language: "Spanish", file: "spabes.json" },
  { id: "SPBLL", label: "Spanish BLL (draft, 2026)", language: "Spanish", file: "spabll.json" },
  { id: "FLSG", label: "Louis Segond 1910", language: "French", file: "louis-segond-1910.json" },
  { id: "DEU1912", label: "Lutherbibel 1912", language: "German", file: "luther-1912.json" },
  { id: "NLD1917", label: "De Heilige Schrift 1917", language: "Dutch", file: "dutch-1917.json" },
  { id: "RUSSY", label: "Russian Synodal Bible", language: "Russian", file: "russian-synodal.json" },
  { id: "ARBVD", label: "Arabic Van Dyck Bible", language: "Arabic", file: "arabic-van-dyck.json" },
  { id: "PORBPM", label: "Bíblia Portuguesa Mundial (draft)", language: "Portuguese", file: "portuguese-world.json" },
  { id: "UKR1905", label: "Ukrainian Bible by Kulish and Pulyui (1905)", language: "Ukrainian", file: "ukrainian-1905.json" },
  { id: "ITADIO", label: "Diodati Bibbia 1885", language: "Italian", file: "diodati-1885.json" },
  { id: "ITARIV", label: "Riveduta Bibbia 1927", language: "Italian", file: "riveduta-1927.json" },
  { id: "HEBDEL", label: "Modern Hebrew Bible (Delitzsch)", language: "Hebrew", file: "hebrew-delitzsch.json" },
  { id: "HEBWLC", label: "Hebrew Old Testament (WLC)", language: "Hebrew", file: "hebrew-wlc.json" },
  { id: "ELVAM", label: "Vamvas Modern Greek Bible (1850)", language: "Modern Greek", file: "greek-vamvas.json" },
  { id: "GRCLXX", label: "Septuagint (LXX, Old Testament)", language: "Ancient Greek", file: "greek-septuagint.json" },
  { id: "GRCMT", label: "Greek Majority Text (New Testament)", language: "Ancient Greek", file: "greek-majority-nt.json" },
];
const translationLanguages = [...new Set(translations.map((translation) => translation.language))];

function ScriptureText({ text, segments }: { text: string; segments: Array<[number, number]> }) {
  if (!segments.length) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  segments.forEach(([rawStart, rawEnd], index) => {
    const start = Math.max(cursor, Math.min(text.length, rawStart));
    const end = Math.max(start, Math.min(text.length, rawEnd));
    if (end <= start) return;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <span className="word-christ-words" key={`${start}-${index}`}>
        {text.slice(start, end)}
      </span>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export function ScriptureReader({ scriptureBaseUrl }: { scriptureBaseUrl: string }) {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [translationId, setTranslationId] = useState("KJV");
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [readyToRemember, setReadyToRemember] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ bookName: string; chapter: number } | null>(null);
  const [fontScale, setFontScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [jumpNumber, setJumpNumber] = useState(0);
  const selectedTranslation = translations.find((translation) => translation.id === translationId) ?? translations[0];

  useEffect(() => {
    let cancelled = false;

    const bibleUrl = `${scriptureBaseUrl.replace(/\/+$/, "")}/${selectedTranslation.file}`;

    fetch(bibleUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error(`The Bible text could not be loaded (${response.status}).`);
        return response.json() as Promise<BibleData>;
      })
      .then((data) => {
        if (
          !Array.isArray(data.books)
          || data.books.length === 0
          || data.books.length > 66
          || !data.books.every((book) => (
            typeof book.name === "string"
            && Array.isArray(book.chapters)
            && book.chapters.length > 0
            && book.chapters.every((chapter) => Array.isArray(chapter) && chapter.every((verse) => typeof verse === "string"))
          ))
          || !data.redLetterSegments
          || typeof data.redLetterSegments !== "object"
        ) {
          throw new Error("The Bible text file is incomplete.");
        }
        if (!cancelled) setBible(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "The Bible text could not be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [loadAttempt, scriptureBaseUrl, selectedTranslation.file]);

  useEffect(() => {
    if (!bible) return;

    const timeout = window.setTimeout(() => {
      try {
        if (pendingLocation) {
          const matchIndex = bible.books.findIndex((book) => book.name === pendingLocation.bookName);
          const nextBookIndex = matchIndex >= 0 ? matchIndex : 0;
          const nextBook = bible.books[nextBookIndex];
          setBookIndex(nextBookIndex);
          setChapterNumber(matchIndex >= 0 ? Math.min(pendingLocation.chapter, nextBook.chapters.length) : 1);
          setPendingLocation(null);
        } else {
          const saved = window.localStorage.getItem(readingLocationKey);
          if (saved) {
            const location = JSON.parse(saved) as SavedLocation & { bookIndex?: number };
            const savedBookName = typeof location.bookName === "string"
              ? location.bookName
              : bible.books[location.bookIndex ?? -1]?.name;
            const nextBookIndex = bible.books.findIndex((book) => book.name === savedBookName);
            const book = bible.books[nextBookIndex];
            if (book && Number.isInteger(location.chapter) && location.chapter >= 1 && location.chapter <= book.chapters.length) {
              setBookIndex(nextBookIndex);
              setChapterNumber(location.chapter);
            }
          }
        }
      } catch {
        // Continue at the first book when browser storage is unavailable or invalid.
      }
      setReadyToRemember(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [bible, pendingLocation]);

  useEffect(() => {
    if (!bible || !readyToRemember) return;
    try {
      const bookName = bible.books[bookIndex]?.name;
      if (bookName) window.localStorage.setItem(readingLocationKey, JSON.stringify({ bookName, chapter: chapterNumber }));
    } catch {
      // Reading remains available when browser storage is disabled.
    }
  }, [bible, bookIndex, chapterNumber, readyToRemember]);

  const activeBook = bible?.books[bookIndex];
  const activeVerses = activeBook?.chapters[chapterNumber - 1] ?? [];

  const selectTranslation = (nextTranslationId: string) => {
    if (nextTranslationId === translationId) return;
    setPendingLocation(activeBook ? { bookName: activeBook.name, chapter: chapterNumber } : null);
    setReadyToRemember(false);
    setTranslationId(nextTranslationId);
    setBible(null);
    setLoadError(null);
    setSearchResults([]);
    setSearchMessage("");
    clearHighlight();
  };

  useEffect(() => {
    if (highlightedVerse === null) return;
    const verseElement = document.getElementById(`word-verse-${highlightedVerse}`);
    if (!verseElement) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    verseElement.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    const timeout = window.setTimeout(() => setHighlightedVerse(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [activeBook, chapterNumber, highlightedVerse, jumpNumber]);

  const clearHighlight = () => setHighlightedVerse(null);

  const selectBook = (nextBookIndex: number) => {
    setBookIndex(nextBookIndex);
    setChapterNumber(1);
    clearHighlight();
  };

  const selectChapter = (nextChapterNumber: number) => {
    setChapterNumber(nextChapterNumber);
    clearHighlight();
  };

  const moveChapter = (direction: -1 | 1) => {
    if (!bible || !activeBook) return;
    clearHighlight();

    if (direction < 0) {
      if (chapterNumber > 1) {
        setChapterNumber(chapterNumber - 1);
      } else if (bookIndex > 0) {
        const previousBookIndex = bookIndex - 1;
        setBookIndex(previousBookIndex);
        setChapterNumber(bible.books[previousBookIndex].chapters.length);
      }
      return;
    }

    if (chapterNumber < activeBook.chapters.length) {
      setChapterNumber(chapterNumber + 1);
    } else if (bookIndex < bible.books.length - 1) {
      setBookIndex(bookIndex + 1);
      setChapterNumber(1);
    }
  };

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchQuery.trim().toLocaleLowerCase();
    if (term.length < 2) {
      setSearchResults([]);
      setSearchMessage("Enter at least two characters to search the Bible.");
      return;
    }
    if (!bible) return;

    const results: SearchResult[] = [];
    let matchCount = 0;
    bible.books.forEach((book, currentBookIndex) => {
      book.chapters.forEach((verses, chapterIndex) => {
        verses.forEach((text, verseIndex) => {
          if (!text.toLocaleLowerCase().includes(term)) return;
          matchCount += 1;
          if (results.length < maximumSearchResults) {
            const reference = `${book.name}|${chapterIndex + 1}|${verseIndex + 1}`;
            results.push({
              bookIndex: currentBookIndex,
              chapter: chapterIndex + 1,
              verse: verseIndex + 1,
              text,
              redSegments: bible.redLetterSegments[reference] ?? [],
            });
          }
        });
      });
    });

    setSearchResults(results);
    setSearchMessage(matchCount === 0
      ? `No matches found for “${searchQuery.trim()}”.`
      : matchCount > results.length
        ? `Showing the first ${results.length} of ${matchCount} matches.`
        : `${matchCount} ${matchCount === 1 ? "match" : "matches"} found.`);
  };

  const openSearchResult = (result: SearchResult) => {
    setBookIndex(result.bookIndex);
    setChapterNumber(result.chapter);
    setHighlightedVerse(result.verse);
    setJumpNumber((current) => current + 1);
  };

  return (
    <main className="word-page" id="main-content">
      <div className="word-container">
        <header className="word-heading">
          <p className="word-eyebrow"><BookOpen aria-hidden="true" size={16} /> Open Scripture</p>
          <h1 id="word-title">The <em>Word</em></h1>
          <p>Choose a translation, find a passage, and continue reading.</p>
        </header>

        <section aria-label="Bible navigation and search" className="word-tools">
          <div className="word-browse">
            <div className="word-tool-heading">
              <span className="word-tool-icon"><BookOpen aria-hidden="true" size={18} /></span>
              <div>
                <h2>Choose a passage</h2>
                <p>Browse the books available in your selected translation.</p>
              </div>
            </div>
            <div className="word-selects">
              <label>
                <span>Translation</span>
                <select
                  aria-label="Bible translation"
                  onChange={(event) => selectTranslation(event.target.value)}
                  value={translationId}
                >
                  {translationLanguages.map((language) => (
                    <optgroup key={language} label={language}>
                      {translations.filter((translation) => translation.language === language).map((translation) => (
                        <option key={translation.id} value={translation.id}>{translation.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                <span>Book</span>
                <select
                  aria-label="Bible book"
                  disabled={!bible}
                  onChange={(event) => selectBook(Number(event.target.value))}
                  value={bookIndex}
                >
                  {(bible?.books ?? []).map((book, index) => <option key={book.name} value={index}>{book.name}</option>)}
                </select>
              </label>
              <label>
                <span>Chapter</span>
                <select
                  aria-label="Bible chapter"
                  disabled={!activeBook}
                  onChange={(event) => selectChapter(Number(event.target.value))}
                  value={chapterNumber}
                >
                  {(activeBook?.chapters ?? []).map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                </select>
              </label>
            </div>
          </div>

          <form className="word-search" onSubmit={search}>
            <label htmlFor="word-search-input">Search the Bible</label>
            <div className="word-search-row">
              <input
                autoComplete="off"
                id="word-search-input"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="A word or phrase"
                type="search"
                value={searchQuery}
              />
              <button aria-label="Search the Bible" className="word-search-button" disabled={!bible} type="submit">
                <Search aria-hidden="true" size={17} />
                <span>Search</span>
              </button>
            </div>
            <p className="word-search-hint">Search is case-insensitive and checks the selected translation.</p>
          </form>
        </section>

        {loadError && (
          <div className="word-load-error" role="alert">
            <p>{loadError}</p>
            <button className="word-retry-button" onClick={() => {
              setLoadError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }} type="button">
              Try again
            </button>
          </div>
        )}

        {searchMessage && (
          <section aria-label="Search results" className="word-search-results">
            <div className="word-search-results-heading">
              <div>
                <h2>Search results</h2>
                <p aria-live="polite">{searchMessage}</p>
              </div>
              {searchResults.length > 0 && (
                <button className="word-clear-search" onClick={() => {
                  setSearchResults([]);
                  setSearchMessage("");
                  setSearchQuery("");
                }} type="button">
                  Clear results
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <ul className="word-result-list">
                {searchResults.map((result) => {
                  const reference = `${bible?.books[result.bookIndex].name} ${result.chapter}:${result.verse}`;
                  return (
                    <li key={`${result.bookIndex}-${result.chapter}-${result.verse}`}>
                      <button
                        aria-label={`Open ${reference}`}
                        className="word-result"
                        onClick={() => openSearchResult(result)}
                        type="button"
                      >
                        <strong>{reference}</strong>
                        <span><ScriptureText segments={result.redSegments} text={result.text} /></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {!bible && !loadError && (
          <div className="word-loading" role="status">
            <span className="word-loading-mark"><BookOpen aria-hidden="true" size={22} /></span>
            <p>Preparing the reader…</p>
          </div>
        )}

        {bible && activeBook && (
          <section aria-labelledby="word-reader-title" className="word-reader-section">
            <div className="word-reader-toolbar">
              <p><span /> {bible.translation} <span className="word-toolbar-separator">·</span> {activeVerses.length} verses</p>
              <div aria-label="Reading text size" className="word-font-controls">
                <span>Text size</span>
                <button
                  aria-label="Make Bible text smaller"
                  disabled={fontScale <= 0.85}
                  onClick={() => setFontScale((scale) => Math.max(0.85, Number((scale - 0.1).toFixed(2))))}
                  type="button"
                >
                  <Minus aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label="Make Bible text larger"
                  disabled={fontScale >= 1.4}
                  onClick={() => setFontScale((scale) => Math.min(1.4, Number((scale + 0.1).toFixed(2))))}
                  type="button"
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
              </div>
            </div>

            <article className="word-reading-paper" style={{ "--word-font-scale": fontScale } as CSSProperties}>
              <header className="word-reading-heading">
                <p>{bible.translation}</p>
                <h2 id="word-reader-title">{activeBook.name} <em>{chapterNumber}</em></h2>
              </header>
              <div
                aria-label={`${activeBook.name} chapter ${chapterNumber}`}
                className="word-verses"
                dir={bible.direction ?? "ltr"}
                lang={bible.languageCode}
              >
                {activeVerses.map((verse, index) => {
                  const verseNumber = index + 1;
                  return (
                    <p
                      className={`word-verse${highlightedVerse === verseNumber ? " is-highlighted" : ""}`}
                      id={`word-verse-${verseNumber}`}
                      key={verseNumber}
                    >
                      <sup>{verseNumber}</sup>
                      <span>
                        {verse ? (
                          <ScriptureText
                            segments={bible.redLetterSegments[`${activeBook.name}|${chapterNumber}|${verseNumber}`] ?? []}
                            text={verse}
                          />
                        ) : (
                          <span className="word-verse-missing">Verse text unavailable in this source.</span>
                        )}
                      </span>
                    </p>
                  );
                })}
              </div>
              <nav aria-label="Bible chapter navigation" className="word-chapter-nav">
                <button
                  disabled={bookIndex === 0 && chapterNumber === 1}
                  onClick={() => moveChapter(-1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={18} />
                  <span>Previous chapter</span>
                </button>
                <span>{activeBook.name} {chapterNumber}</span>
                <button
                  disabled={bookIndex === bible.books.length - 1 && chapterNumber === activeBook.chapters.length}
                  onClick={() => moveChapter(1)}
                  type="button"
                >
                  <span>Next chapter</span>
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </nav>
            </article>
          </section>
        )}
        <p className="word-source-note">
          Some source editions have blank verse entries. Source-marked Christ speech is highlighted when available; otherwise, red-letter highlights follow the King James Version’s verse references.
          {bible?.source && (
            <>
              {" "}Source: <a href={bible.source.url} rel="noreferrer" target="_blank">{bible.source.name}</a> ({bible.source.license}). {bible.source.attribution}
            </>
          )}
        </p>
      </div>
    </main>
  );
}
