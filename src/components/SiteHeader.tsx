"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown, X } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/media/", label: "Media" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const routePath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  const normalizedPath = routePath.endsWith("/") ? routePath : `${routePath}/`;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

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
        <nav aria-label="Primary navigation" className="primary-navigation">
          {navigation.map(({ href, label }) => {
            const isCurrent = normalizedPath === href;
            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={`nav-link${isCurrent ? " is-current" : ""}`}
                href={href}
                key={href}
              >
                <Crown aria-hidden="true" size={16} strokeWidth={1.7} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mobile-navigation" ref={mobileNavigationRef}>
          <nav
            aria-label="Mobile navigation"
            className="mobile-menu-options"
            hidden={!isMobileMenuOpen}
            id="mobile-navigation-options"
          >
            {navigation.map(({ href, label }) => {
              const isCurrent = normalizedPath === href;
              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`mobile-menu-link${isCurrent ? " is-current" : ""}`}
                  href={href}
                  key={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Crown aria-hidden="true" size={15} strokeWidth={1.7} />
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
            {isMobileMenuOpen ? <X aria-hidden="true" size={18} /> : <Crown aria-hidden="true" size={18} />}
            <span>Menu</span>
            {!isMobileMenuOpen && <ChevronDown aria-hidden="true" size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
