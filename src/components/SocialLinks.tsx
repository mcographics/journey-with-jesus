"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// The footer may show official platforms that are not yet in the Studio DB enum.
type SocialLink = Omit<Pick<Database["public"]["Tables"]["media_social_links"]["Row"], "id" | "platform" | "label" | "url" | "sort_order">, "platform"> & {
  platform: string;
};

const initialLinks: SocialLink[] = [
  { id: "initial-youtube", platform: "youtube", label: "YouTube", url: "https://www.youtube.com/@KerygmaPath", sort_order: 0 },
  { id: "initial-facebook", platform: "facebook", label: "Facebook", url: "https://www.facebook.com/KerygmaPath", sort_order: 1 },
  { id: "official-instagram", platform: "instagram", label: "Instagram", url: "https://www.instagram.com/kerygma_Path/", sort_order: 2 },
  { id: "official-threads", platform: "threads", label: "Threads", url: "https://www.threads.com/@kerygma_Path", sort_order: 3 },
];

const newOfficialLinks = initialLinks.filter((link) =>
  link.platform === "instagram" || link.platform === "threads",
);

export default function SocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let active = true;
    void client
      .from("media_social_links")
      .select("id, platform, label, url, sort_order")
      .eq("published", true)
      .order("sort_order")
      .order("label")
      .then(({ data, error }) => {
        if (active && !error && data) {
          // Keep published Studio links, but ensure the official Instagram and
          // Threads URLs always appear in the footer (without duplicates).
          const existing = data.length > 0 ? data : initialLinks;
          const otherLinks = existing.filter(
            (link) => link.platform !== "instagram" && link.platform !== "threads",
          );
          setLinks([...otherLinks, ...newOfficialLinks].sort(
            (a, b) => a.sort_order - b.sort_order,
          ));
        }
      });
    return () => { active = false; };
  }, []);

  if (links.length === 0) return null;

  return (
    <nav aria-label="Kerygma Path social media" className="footer-social-links">
      {links.map((link) => (
        <a
          key={link.id}
          aria-label={`${link.label} (opens in a new tab)`}
          className="footer-social-link"
          data-platform={link.platform}
          href={link.url}
          rel="noopener noreferrer"
          target="_blank"
          title={link.label}
        >
          <SocialIcon platform={link.platform} label={link.label} />
        </a>
      ))}
    </nav>
  );
}

function SocialIcon({ platform, label }: { platform: string; label: string }) {
  if (platform === "youtube") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" /></svg>;
  }
  if (platform === "facebook") {
    return <svg aria-hidden="true" viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06H297V6.26S260.43 0 225.36 0C152.8 0 105.47 44.38 105.47 124.72v70.62H24.5V288h80.97v224h99.2V288z" /></svg>;
  }
  if (platform === "instagram") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.7" cy="6.4" r=".8" fill="currentColor" stroke="none" /></svg>;
  }
  if (platform === "threads") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" /></svg>;
  }
  if (platform === "bluesky") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5.7 1.3C8.25 3.22 10.99 7.12 12 9.2c1.01-2.08 3.75-5.98 6.3-7.9 1.83-1.39 4.79-2.46 4.79.74 0 .64-.37 5.37-.58 6.14-.75 2.68-3.5 3.36-5.94 2.94 4.27.73 5.36 3.15 3.01 5.56-4.46 4.57-6.41-1.15-6.91-2.6-.09-.26-.13-.38-.17-.32-.04-.05-.08-.06-.11-.01-.04.05-.13.22-.22.48-.5 1.45-2.45 7.17-6.91 2.6-2.35-2.41-1.26-4.83 3.01-5.56-2.44.42-5.19-.26-5.94-2.94C1.7 7.41 1.33 2.68 1.33 2.04c0-3.2 2.96-2.13 4.37-.74Z" /></svg>;
  }
  if (platform === "rumble") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5.4 2.6c-.9-.5-2 .2-2 1.3v16.2c0 1.1 1.1 1.8 2 1.3l14.6-8.1c1-.5 1-1.9 0-2.4L5.4 2.6Zm2 5 8 4.4-8 4.4V7.6Z" fillRule="evenodd" /></svg>;
  }
  if (platform === "x") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 3h4.5L20 21h-4.5L4 3Z" /><path d="m20 3-7.4 8.3M11.3 12.5 4 21" /></svg>;
  }
  const marks: Record<string, string> = { tiktok: "♪", linkedin: "in", pinterest: "P", twitch: "T", discord: "D", custom: "↗" };
  return <span aria-hidden="true" className="footer-social-mark">{marks[platform] ?? label.slice(0, 1).toUpperCase()}</span>;
}
