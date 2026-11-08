"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { translateSiteText, type SiteLocale } from "@/data/site-translations";

type Language = { code: SiteLocale; name: string; label: string };

const languages: Language[] = [
  { code: "en", name: "English", label: "EN" },
  { code: "fr", name: "Français", label: "FR" },
  { code: "es", name: "Español", label: "ES" },
];

type SavedText = { source: string; lastApplied: string };
const originalText = new WeakMap<Text, SavedText>();
const originalAttributes = new WeakMap<Element, Map<string, SavedText>>();
const translatableAttributes = ["alt", "aria-label", "aria-description", "placeholder", "title", "content"];

function getTextSource(node: Text) {
  const current = node.nodeValue ?? "";
  let saved = originalText.get(node);
  if (!saved) {
    saved = { source: current, lastApplied: current };
    originalText.set(node, saved);
  } else if (current !== saved.lastApplied && current !== saved.source) {
    // React may replace a text value after a component updates.
    saved.source = current;
  }
  return saved;
}

function translateTextNode(node: Text, locale: SiteLocale) {
  const saved = getTextSource(node);
  const source = saved.source;
  const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return;
  const translated = translateSiteText(match[2].replace(/\s+/g, " ").trim(), locale);
  const suffix = locale === "fr" && /[’']$/.test(translated) ? "" : match[3];
  const value = `${match[1]}${translated}${suffix}`;
  if (node.nodeValue !== value) node.nodeValue = value;
  saved.lastApplied = value;
}

function translateElementAttributes(element: Element, locale: SiteLocale) {
  let savedAttributes = originalAttributes.get(element);
  if (!savedAttributes) {
    savedAttributes = new Map();
    originalAttributes.set(element, savedAttributes);
  }

  for (const attribute of translatableAttributes) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute) ?? "";
    let saved = savedAttributes.get(attribute);
    if (!saved) {
      saved = { source: current, lastApplied: current };
      savedAttributes.set(attribute, saved);
    } else if (current !== saved.lastApplied && current !== saved.source) {
      saved.source = current;
    }
    const translated = translateSiteText(saved.source.trim(), locale);
    if (current !== translated) element.setAttribute(attribute, translated);
    saved.lastApplied = translated;
  }
}

function translateNode(node: Node, locale: SiteLocale) {
  if (node instanceof Text) {
    if (!node.parentElement?.closest("script,style,noscript,[translate='no']")) {
      translateTextNode(node, locale);
    }
    return;
  }

  if (!(node instanceof Element) || node.closest("script,style,noscript,[translate='no']")) return;
  translateElementAttributes(node, locale);
  node.childNodes.forEach((child) => translateNode(child, locale));
}

function applySiteLanguage(locale: SiteLocale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  translateNode(document.head, locale);
  translateNode(document.body, locale);
}

export function SiteLanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState<SiteLocale>("en");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem("kerygmapath-language");
        if (saved === "fr" || saved === "es") setLanguageCode(saved);
      } catch {
        // The switcher still works for this visit if browser storage is unavailable.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    applySiteLanguage(languageCode);
    try {
      window.localStorage.setItem("kerygmapath-language", languageCode);
    } catch {
      // Keep the selected language active for this page view.
    }
  }, [languageCode, pathname]);

  useEffect(() => {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          translateNode(record.target, languageCode);
          continue;
        }
        if (record.type === "characterData") {
          translateNode(record.target, languageCode);
          continue;
        }
        record.addedNodes.forEach((node) => translateNode(node, languageCode));
      }
    });
    const observerOptions: MutationObserverInit = {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatableAttributes,
    };
    observer.observe(document.head, observerOptions);
    observer.observe(document.body, observerOptions);
    return () => observer.disconnect();
  }, [languageCode]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        rootRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const selected = languages.find(({ code }) => code === languageCode) ?? languages[0];

  return (
    <div className="site-language-switcher" ref={rootRef}>
      <button
        aria-controls="site-language-options"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={languageCode === "en"
          ? "Website language: English"
          : languageCode === "fr"
            ? "Website language: French"
            : "Website language: Spanish"}
        className="site-language-toggle"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span>{selected.label}</span>
        <span className="site-language-bracket" aria-hidden="true">[</span>
        <ChevronDown aria-hidden="true" size={14} />
        <span className="site-language-bracket" aria-hidden="true">]</span>
      </button>

      {isOpen && (
        <div
          aria-label="Choose website language"
          className="site-language-options"
          id="site-language-options"
          ref={menuRef}
          role="listbox"
        >
          {languages.map(({ code, name, label }) => (
            <button
              aria-selected={code === languageCode}
              className={`site-language-option${code === languageCode ? " is-selected" : ""}`}
              key={code}
              onClick={() => {
                setIsOpen(false);
                setLanguageCode(code);
              }}
              role="option"
              type="button"
            >
              <span>{name}</span>
              <span className="site-language-option-code">[{label}]</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
