"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SocialLink = Pick<Database["public"]["Tables"]["media_social_links"]["Row"], "id" | "platform" | "label" | "url" | "sort_order">;

const initialLinks: SocialLink[] = [
  { id: "initial-youtube", platform: "youtube", label: "YouTube", url: "https://www.youtube.com/@KerygmaPath", sort_order: 0 },
  { id: "initial-facebook", platform: "facebook", label: "Facebook", url: "https://www.facebook.com/KerygmaPath", sort_order: 1 },
];

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
        if (active && !error && data) setLinks(data);
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
  if (platform === "x") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 3h4.5L20 21h-4.5L4 3Z" /><path d="m20 3-7.4 8.3M11.3 12.5 4 21" /></svg>;
  }
  const marks: Record<string, string> = { tiktok: "♪", linkedin: "in", pinterest: "P", twitch: "T", discord: "D", custom: "↗" };
  return <span aria-hidden="true" className="footer-social-mark">{marks[platform] ?? label.slice(0, 1).toUpperCase()}</span>;
}
