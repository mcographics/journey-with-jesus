"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

type Language = { code: string; name: string };

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "bg", name: "Bulgarian" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "no", name: "Norwegian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "es", name: "Spanish" },
  { code: "sv", name: "Swedish" },
  { code: "ca", name: "Catalan" },
  { code: "tl", name: "Filipino" },
  { code: "iw", name: "Hebrew" },
  { code: "id", name: "Indonesian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "uk", name: "Ukrainian" },
  { code: "vi", name: "Vietnamese" },
  { code: "sq", name: "Albanian" },
  { code: "et", name: "Estonian" },
  { code: "gl", name: "Galician" },
  { code: "hu", name: "Hungarian" },
  { code: "mt", name: "Maltese" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "fa", name: "Persian" },
  { code: "af", name: "Afrikaans" },
  { code: "ms", name: "Malay" },
  { code: "sw", name: "Swahili" },
  { code: "ga", name: "Irish" },
  { code: "cy", name: "Welsh" },
  { code: "be", name: "Belarusian" },
  { code: "is", name: "Icelandic" },
  { code: "mk", name: "Macedonian" },
  { code: "yi", name: "Yiddish" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "ka", name: "Georgian" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "ceb", name: "Cebuano" },
  { code: "eo", name: "Esperanto" },
  { code: "gu", name: "Gujarati" },
  { code: "ha", name: "Hausa" },
  { code: "hmn", name: "Hmong" },
  { code: "ig", name: "Igbo" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "km", name: "Khmer" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "ne", name: "Nepali" },
  { code: "pa", name: "Punjabi" },
  { code: "so", name: "Somali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ny", name: "Chichewa" },
  { code: "kk", name: "Kazakh" },
  { code: "mg", name: "Malagasy" },
  { code: "ml", name: "Malayalam" },
  { code: "si", name: "Sinhala" },
  { code: "st", name: "Sesotho" },
  { code: "su", name: "Sundanese" },
  { code: "tg", name: "Tajik" },
  { code: "uz", name: "Uzbek" },
  { code: "am", name: "Amharic" },
  { code: "co", name: "Corsican" },
  { code: "haw", name: "Hawaiian" },
  { code: "ku", name: "Kurdish (Kurmanji)" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lb", name: "Luxembourgish" },
  { code: "ps", name: "Pashto" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "fy", name: "Frisian" },
  { code: "xh", name: "Xhosa" },
];

declare global {
  interface Window {
    gtranslateSettings?: {
      default_language: string;
      languages: string[];
      wrapper_selector: string;
    };
  }
}

function readSavedLanguage() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  const code = match?.[1] ?? window.localStorage.getItem("kerygmapath-language") ?? "en";
  return languages.some((language) => language.code === code) ? code : "en";
}

export function SiteLanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState("en");
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);

  useEffect(() => {
    const savedLanguageFrame = window.requestAnimationFrame(() => {
      setLanguageCode(readSavedLanguage());
    });

    window.gtranslateSettings = {
      default_language: "en",
      languages: languages.map(({ code }) => code),
      wrapper_selector: ".gtranslate_wrapper",
    };

    const existingScript = document.getElementById("gtranslate-language-widget") as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    let attempts = 0;
    let interval = 0;

    const findWidget = () => {
      const selector = rootRef.current?.querySelector("select.gt_selector")
        ?? rootRef.current?.querySelector("select");
      if (selector) {
        setWidgetReady(true);
        window.clearInterval(interval);
        return true;
      }
      return false;
    };

    if (!existingScript) {
      script.id = "gtranslate-language-widget";
      script.src = "https://cdn.gtranslate.net/widgets/latest/dropdown.js";
      script.async = true;
      document.body.appendChild(script);
    }

    interval = window.setInterval(() => {
      attempts += 1;
      if (findWidget()) return;
      if (attempts >= 40) {
        window.clearInterval(interval);
        setWidgetFailed(true);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
      window.cancelAnimationFrame(savedLanguageFrame);
    };
  }, []);

  useEffect(() => {
    if (pendingLanguage === null) return;

    const code = pendingLanguage;
    // Keep <html lang="en"> as the translation source language. GTranslate
    // reads it when applying the saved googtrans target-language cookie.
    if (code === "en") {
      document.cookie = "googtrans=; Max-Age=0; Path=/; SameSite=Lax";
      document.cookie = "googtrans=; Max-Age=0; Path=/; Domain=.kerygmapath.com; SameSite=Lax";
      try {
        window.localStorage.removeItem("kerygmapath-language");
      } catch {}
    } else {
      try {
        window.localStorage.setItem("kerygmapath-language", code);
      } catch {}
      document.cookie = `googtrans=/en/${code}; Max-Age=31536000; Path=/; SameSite=Lax`;
      document.cookie = `googtrans=/en/${code}; Max-Age=31536000; Path=/; Domain=.kerygmapath.com; SameSite=Lax`;
      const selector = rootRef.current?.querySelector<HTMLSelectElement>("select.gt_selector")
        ?? rootRef.current?.querySelector<HTMLSelectElement>("select");
      if (selector) {
        selector.value = code;
        selector.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const reloadTimer = window.setTimeout(() => window.location.reload(), 350);
    return () => window.clearTimeout(reloadTimer);
  }, [pendingLanguage]);

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

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    const selectedLanguage = readSavedLanguage();
    if (selectedLanguage !== "en") window.location.reload();
  }, [pathname]);

  const chooseLanguage = (code: string) => {
    const selector = rootRef.current?.querySelector<HTMLSelectElement>("select.gt_selector")
      ?? rootRef.current?.querySelector<HTMLSelectElement>("select");
    if (!selector) {
      setWidgetFailed(true);
      return;
    }

    setIsOpen(false);
    setWidgetFailed(false);
    setLanguageCode(code);
    setPendingLanguage(code);
  };

  const selectedName = languages.find(({ code }) => code === languageCode)?.name ?? "English";

  return (
    <div className="site-language-switcher" ref={rootRef}>
      <button
        aria-controls="site-language-options"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Website language: ${selectedName}`}
        className="site-language-toggle"
        disabled={!widgetReady}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span>{languageCode.toUpperCase()}</span>
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
          translate="no"
        >
          {languages.map(({ code, name }) => (
            <button
              aria-selected={code === languageCode}
              className={`site-language-option${code === languageCode ? " is-selected" : ""}`}
              key={code}
              onClick={() => chooseLanguage(code)}
              role="option"
              type="button"
            >
              <span>{name}</span>
              <span className="site-language-option-code">[{code.toUpperCase()}]</span>
            </button>
          ))}
        </div>
      )}

      {widgetFailed && (
        <span className="site-language-error" role="status">
          The translation service could not load. Please try again.
        </span>
      )}

      <div aria-hidden="true" className="gtranslate_wrapper site-language-engine" translate="no" />
    </div>
  );
}
