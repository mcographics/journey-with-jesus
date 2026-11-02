"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/media/", label: "Media" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const routePath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  const normalizedPath = routePath.endsWith("/") ? routePath : `${routePath}/`;

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
      </div>
    </header>
  );
}
