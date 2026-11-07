"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, Crown, Menu, Moon, Newspaper, Sun, X } from "lucide-react";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";

const navigation = [
  { href: "/company/", label: "Studio" },
  { href: "/blog/", label: "Blog" },
  { href: "/word/", label: "The Word" },
  { href: "/projects/journey-with-jesus/", label: "Journey with Jesus" },
  { href: "/media/", label: "Media" },
  { href: "/characters/", label: "Meet the Characters" },
  { href: "/team/", label: "Meet the Team" },
  { href: "/store/", label: "Store" },
];

type ThemeMode = "auto" | "light" | "dark";
type ColorTheme = "light" | "dark";

const getTimeBasedTheme = (): ColorTheme => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
};

const getNextThemeSwitchDelay = () => {
  const now = new Date();
  const next = new Date(now);
  if (now.getHours() < 7) {
    next.setHours(7, 0, 0, 0);
  } else if (now.getHours() < 19) {
    next.setHours(19, 0, 0, 0);
  } else {
    next.setDate(now.getDate() + 1);
    next.setHours(7, 0, 0, 0);
  }
  return Math.max(1000, next.getTime() - now.getTime() + 50);
};

const setThemeColor = (theme: ColorTheme) => {
  document.querySelector("meta[name='theme-color']")?.setAttribute(
    "content",
    theme === "light" ? "#f8f6f0" : "#0B1120",
  );
};

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const routePath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  const normalizedPath = routePath.endsWith("/") ? routePath : `${routePath}/`;
  const isJourneySection = normalizedPath.startsWith("/projects/journey-with-jesus/")
    || normalizedPath.startsWith("/media/") || normalizedPath.startsWith("/characters/");
  const visibleNavigation = navigation.filter(({ href }) => {
    if (href === "/blog/" || href === "/word/") return true;
    if (href === "/company/") return normalizedPath !== "/company/";
    if (isJourneySection) return href === "/media/" || href === "/characters/";
    return href === "/projects/journey-with-jesus/" || href === "/team/" || href === "/store/";
  });
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const desktopNavigationRef = useRef<HTMLDivElement>(null);
  const desktopMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let storedMode: string | null = document.documentElement.dataset.themeMode ?? null;
    try {
      storedMode = window.localStorage.getItem("journey-with-jesus-theme-mode") ?? storedMode;
    } catch {}
    const mode: ThemeMode = storedMode === "light" || storedMode === "dark" ? storedMode : "auto";
    const resolvedTheme = mode === "auto" ? getTimeBasedTheme() : mode;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.theme = resolvedTheme;
    if (mode !== "auto") {
      window.setTimeout(() => setThemeMode(mode), 0);
    }
    setThemeColor(resolvedTheme);
  }, []);

  useEffect(() => {
    if (themeMode !== "auto") return;

    let switchTimer: number | undefined;
    const updateFromLocalTime = () => {
      if (document.documentElement.dataset.themeMode !== "auto") return;
      const nextTheme = getTimeBasedTheme();
      if (document.documentElement.dataset.theme !== nextTheme) {
        document.documentElement.dataset.theme = nextTheme;
        setThemeColor(nextTheme);
      }
    };
    const scheduleNextSwitch = () => {
      if (switchTimer !== undefined) window.clearTimeout(switchTimer);
      switchTimer = window.setTimeout(() => {
        updateFromLocalTime();
        scheduleNextSwitch();
      }, getNextThemeSwitchDelay());
    };
    const updateWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      updateFromLocalTime();
      scheduleNextSwitch();
    };

    scheduleNextSwitch();
    document.addEventListener("visibilitychange", updateWhenVisible);
    return () => {
      if (switchTimer !== undefined) window.clearTimeout(switchTimer);
      document.removeEventListener("visibilitychange", updateWhenVisible);
    };
  }, [themeMode]);

  const toggleTheme = () => {
    const nextMode: ThemeMode =
      themeMode === "auto" ? "light" : themeMode === "light" ? "dark" : "auto";
    const nextTheme = nextMode === "auto" ? getTimeBasedTheme() : nextMode;
    setThemeMode(nextMode);
    document.documentElement.dataset.themeMode = nextMode;
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("journey-with-jesus-theme-mode", nextMode);
    } catch {}
    setThemeColor(nextTheme);
  };

  useEffect(() => {
    const touchMobile = window.matchMedia("(max-width: 768px) and (hover: none) and (pointer: coarse)");
    let hideTimer: number | undefined;

    const clearHideTimer = () => {
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
      }
    };
    const scheduleHide = () => {
      clearHideTimer();
      if (!touchMobile.matches) {
        setIsAutoHidden(false);
        return;
      }
      hideTimer = window.setTimeout(() => setIsAutoHidden(true), 1000);
    };
    const showWhileScrolling = () => {
      if (!touchMobile.matches) return;
      setIsAutoHidden(false);
      scheduleHide();
    };
    const updateForInputMode = () => {
      setIsAutoHidden(false);
      scheduleHide();
    };

    window.addEventListener("scroll", showWhileScrolling, { passive: true });
    touchMobile.addEventListener("change", updateForInputMode);
    scheduleHide();

    return () => {
      clearHideTimer();
      window.removeEventListener("scroll", showWhileScrolling);
      touchMobile.removeEventListener("change", updateForInputMode);
    };
  }, []);

  useEffect(() => {
    if (!isDesktopMenuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!desktopNavigationRef.current?.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDesktopMenuOpen(false);
        desktopMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDesktopMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!mobileNavigationRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="desktop-navigation" ref={desktopNavigationRef}>
          <button
            aria-controls="desktop-navigation-options"
            aria-expanded={isDesktopMenuOpen}
            aria-label={isDesktopMenuOpen ? "Close site menu" : "Open site menu"}
            className="desktop-menu-toggle"
            onClick={() => setIsDesktopMenuOpen((open) => !open)}
            ref={desktopMenuButtonRef}
            type="button"
          >
            {isDesktopMenuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            <span>Menu</span>
            <ChevronDown aria-hidden="true" className="desktop-menu-chevron" size={15} />
          </button>
          <nav
            aria-label="Primary navigation"
            className="desktop-menu-options"
            hidden={!isDesktopMenuOpen}
            id="desktop-navigation-options"
          >
            {visibleNavigation.map(({ href, label }) => {
              const isCurrent = normalizedPath === href;
              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`desktop-menu-link${isCurrent ? " is-current" : ""}`}
                  href={href}
                  key={href}
                  onClick={() => setIsDesktopMenuOpen(false)}
                >
                  {href === "/word/"
                    ? <BookOpen aria-hidden="true" size={15} strokeWidth={1.7} />
                    : href === "/blog/"
                      ? <Newspaper aria-hidden="true" size={15} strokeWidth={1.7} />
                      : <Crown aria-hidden="true" size={15} strokeWidth={1.7} />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <AccessibilitySettings />
        <button
          aria-label={themeMode === "auto"
            ? "Automatic theme is active. Activate to use light mode."
            : themeMode === "light"
              ? "Light mode is active. Activate to use dark mode."
              : "Dark mode is active. Activate to return to automatic theme."}
          className={`theme-toggle theme-toggle-${themeMode}`}
          onClick={toggleTheme}
          title={themeMode === "auto"
            ? "Automatic: light 7 AM–7 PM and dark 7 PM–7 AM, using local time."
            : themeMode === "light"
              ? "Light mode. Activate to switch to dark mode."
              : "Dark mode. Activate to return to automatic theme."}
          type="button"
        >
          <span className="theme-toggle-icons" aria-hidden="true">
            <Sun size={15} strokeWidth={1.8} />
            <span className="theme-toggle-divider" />
            <Moon size={14} strokeWidth={1.8} />
          </span>
        </button>
        <div
          className={`mobile-navigation${isAutoHidden && !isMobileMenuOpen ? " is-autohidden" : ""}`}
          ref={mobileNavigationRef}
        >
          <nav
            aria-label="Mobile navigation"
            className="mobile-menu-options"
            hidden={!isMobileMenuOpen}
            id="mobile-navigation-options"
          >
            {visibleNavigation.map(({ href, label }) => {
              const isCurrent = normalizedPath === href;
              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`mobile-menu-link${isCurrent ? " is-current" : ""}`}
                  href={href}
                  key={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {href === "/word/"
                    ? <BookOpen aria-hidden="true" size={15} strokeWidth={1.7} />
                    : href === "/blog/"
                      ? <Newspaper aria-hidden="true" size={15} strokeWidth={1.7} />
                      : <Crown aria-hidden="true" size={15} strokeWidth={1.7} />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            aria-controls="mobile-navigation-options"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            ref={mobileMenuButtonRef}
            type="button"
          >
            {isMobileMenuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
