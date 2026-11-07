"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { Database, SocialPlatform } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SocialLinkRow = Database["public"]["Tables"]["media_social_links"]["Row"];
type BrowserSupabaseClient = NonNullable<ReturnType<typeof createBrowserSupabaseClient>>;
type SocialLinkDraft = {
  key: string;
  id: string | null;
  platform: SocialPlatform;
  label: string;
  url: string;
  sort_order: number;
  published: boolean;
};

const platformLabels: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  twitch: "Twitch",
  discord: "Discord",
  custom: "Custom link",
};

export function StudioSocialLinks({ client }: { client: BrowserSupabaseClient }) {
  const [links, setLinks] = useState<SocialLinkDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);


  const loadLinks = useCallback(async () => {
    if (!client) return;
    const { data, error } = await client.from("media_social_links").select("*").order("sort_order").order("label");
    if (error) {
      setNotice(error.message || "Social links could not be loaded.");
      setNoticeError(true);
      setLoading(false);
      return;
    }
    setLinks((data ?? []).map((row: SocialLinkRow) => ({
      key: row.id,
      id: row.id,
      platform: row.platform,
      label: row.label,
      url: row.url,
      sort_order: row.sort_order,
      published: row.published,
    })));
    setLoading(false);
  }, [client]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadLinks(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLinks]);

  function updateDraft(key: string, patch: Partial<SocialLinkDraft>) {
    setLinks((current) => current.map((link) => link.key === key ? { ...link, ...patch } : link));
  }

  function addLink() {
    const platform: SocialPlatform = "custom";
    const key = crypto.randomUUID();
    setLinks((current) => [...current, {
      key, id: null, platform, label: "", url: "", sort_order: current.reduce((max, item) => Math.max(max, item.sort_order), -1) + 1, published: true,
    }]);
    setNotice("");
  }

  async function saveLink(event: FormEvent<HTMLFormElement>, link: SocialLinkDraft) {
    event.preventDefault();
    if (!client) return;
    setBusyKey(link.key);
    setNotice("");
    try {
      const label = link.label.trim();
      if (!label) throw new Error("Enter a display name for this social link.");
      let parsedUrl: URL;
      try { parsedUrl = new URL(link.url.trim()); } catch { throw new Error("Enter a valid HTTPS link."); }
      if (parsedUrl.protocol !== "https:") throw new Error("Social links must use HTTPS.");
      const payload = {
        platform: link.platform,
        label,
        url: parsedUrl.toString(),
        sort_order: Math.max(0, Math.floor(Number(link.sort_order) || 0)),
        published: link.published,
      };
      const result = link.id
        ? await client.from("media_social_links").update(payload).eq("id", link.id).select("id").single()
        : await client.from("media_social_links").insert(payload).select("id").single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("Journey Studio did not confirm that the link was saved.");
      setNotice(`${label} saved. Published links appear in the site footer.`);
      setNoticeError(false);
      await loadLinks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The social link could not be saved.");
      setNoticeError(true);
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteLink(link: SocialLinkDraft) {
    if (!link.id) {
      setLinks((current) => current.filter((item) => item.key !== link.key));
      return;
    }
    if (!client || !window.confirm(`Remove ${link.label} from the site footer?`)) return;
    setBusyKey(link.key);
    setNotice("");
    const { error } = await client.from("media_social_links").delete().eq("id", link.id);
    if (error) {
      setNotice(error.message || "The social link could not be removed.");
      setNoticeError(true);
    } else {
      setNotice(`${link.label} removed from the site footer.`);
      setNoticeError(false);
      await loadLinks();
    }
    setBusyKey(null);
  }

  return (
    <section className="studio-social-manager" aria-labelledby="studio-social-heading">
      <div className="studio-panel">
        <div className="studio-social-manager-header">
          <div className="studio-panel-heading">
            <div><h2 id="studio-social-heading">Social media links</h2><p>Add links here to show them beneath the Kerygma Path logo in the site footer. Unpublished links stay visible in Studio but hidden from visitors.</p></div>
        </div>
          <button className="studio-small-button" type="button" onClick={addLink}><Plus size={15} />Add social link</button>
        </div>
        {notice && <p className={"studio-notice" + (noticeError ? " is-error" : "")} role="status">{notice}</p>}
      </div>
      {loading && <p className="studio-loading" role="status"><LoaderCircle className="studio-spin" size={16} />Loading social links…</p>}
      {!loading && links.length === 0 && <div className="studio-panel"><p className="studio-empty">No social links yet. Add one to display it in the footer.</p></div>}
      <div className="studio-social-list">
        {links.map((link) => (
          <form className="studio-panel studio-form studio-social-card" key={link.key} onSubmit={(event) => void saveLink(event, link)}>
            <div className="studio-panel-heading">
              <div><h2>{link.label || (link.id ? "Social link" : "New social link")}</h2><p>{link.published ? "Published in the footer" : "Hidden from visitors"}</p></div>
              <div className="studio-social-card-actions">
                {link.id && <button type="button" className="studio-video-delete" disabled={busyKey === link.key} onClick={() => void deleteLink(link)} aria-label={`Remove ${link.label} social link`}><Trash2 size={14} />Remove</button>}
              </div>
            </div>
            <div className="studio-form-grid">
              <label>Platform
                <select value={link.platform} onChange={(event) => {
                  const platform = event.target.value as SocialPlatform;
                  const wasDefault = link.label === platformLabels[link.platform];
                  updateDraft(link.key, { platform, label: wasDefault ? platformLabels[platform] : link.label });
                }}>
                  {(Object.entries(platformLabels) as [SocialPlatform, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Display name
                <input value={link.label} onChange={(event) => updateDraft(link.key, { label: event.target.value })} maxLength={80} required placeholder="e.g. Instagram" />
              </label>
              <label className="studio-span-two">Page URL
                <input type="url" value={link.url} onChange={(event) => updateDraft(link.key, { url: event.target.value })} maxLength={2048} required placeholder="https://…" />
              </label>
              <label className="studio-social-order">Display order
                <input type="number" min="0" step="1" value={link.sort_order} onChange={(event) => updateDraft(link.key, { sort_order: Number(event.target.value) })} />
              </label>
              <label className="studio-check"><input type="checkbox" checked={link.published} onChange={(event) => updateDraft(link.key, { published: event.target.checked })} />Show in footer</label>
            </div>
            <button className="button button-gold" type="submit" disabled={busyKey === link.key}><Check size={16} />{busyKey === link.key ? "Saving…" : "Save link"}</button>
          </form>
        ))}
      </div>
    </section>
  );
}
