"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Episode } from "@/data/episodes";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import type { Database } from "@/lib/database.types";

type CommentRow = Database["public"]["Tables"]["episode_comments"]["Row"];
export function CommentSection({ episode, general = false, title }: { episode: Episode | null; general?: boolean; title?: string }) {
  const episodeId = general ? "media-community" : episode?.id ?? null;
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [sending, setSending] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!episodeId || !configured) return;
    let active = true;
    const client = createBrowserSupabaseClient();
    if (!client) return;
    void client.from("episode_comments").select("id, episode_id, display_name, body, status, created_at")
      .eq("episode_id", episodeId).eq("status", "approved").order("created_at", { ascending: false }).limit(50)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setIsError(true); setStatus("Comments are temporarily unavailable. Please try again later."); return; }
        setComments(data ?? []);
      });
    return () => { active = false; };
  }, [episodeId, configured]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!episodeId) return;
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || trimmedName.length > 60) { setIsError(true); setStatus("Use a display name between 1 and 60 characters."); return; }
    if (Array.from(trimmedBody).length < 3 || Array.from(trimmedBody).length > 2000) { setIsError(true); setStatus("Write a comment between 3 and 2,000 characters."); return; }
    if (website.trim()) { setIsError(true); setStatus("This submission could not be accepted."); return; }
    const client = createBrowserSupabaseClient();
    if (!client) { setIsError(true); setStatus("Comments are not configured yet."); return; }
    setSending(true); setIsError(false); setStatus("");
    try {
      const { data, error } = await client.functions.invoke("submit-comment", {
        body: { episodeId, displayName: trimmedName, body: trimmedBody, website },
      });
      if (error || data?.status !== "pending") {
        if (data?.error === "rate_limited") throw new Error("Please wait a minute before commenting again.");
        throw new Error("Your comment could not be submitted right now. Please try again later.");
      }
      setName(""); setBody(""); setWebsite("");
      setStatus("Thanks for sharing. Your comment is waiting for review before it appears publicly.");
    } catch (error) {
      setIsError(true);
      setStatus(error instanceof Error ? error.message : "Your comment could not be submitted right now.");
    } finally { setSending(false); }
  }

  const heading = general ? "Media community" : title ?? "Story comments";
  const headingId = general ? "media-community-title" : "episode-comments-title";

  return (
    <section className="comment-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <p className="comment-intro">{general
        ? "Share a reflection, a word of encouragement, or what you hope to see on Journey with Jesus. No account is needed. Comments are reviewed before they appear."
        : "Share a thoughtful reflection on this video or story. No account is needed. Comments are reviewed before they appear."}</p>
      {!episodeId ? (
        <p className="comment-status">Choose a story to see its community conversation.</p>
      ) : !configured ? (
        <div className="comments-unavailable"><strong>Comments are not set up yet.</strong> The story library can be enjoyed while the site owner connects the moderated comments service.</div>
      ) : (
        <>
          {status && <p className={"comment-status" + (isError ? " is-error" : "")} role="status">{status}</p>}
          <div className="comment-list" aria-live="polite">
            {comments.length === 0 ? <p className="comment-status">No comments yet. Be the first to share a reflection.</p> : comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <strong>{comment.display_name}</strong>
                <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString()}</time>
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
          <form className="comment-form" onSubmit={submitComment}>
            <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoComplete="nickname" required /></label>
            <label>Your reflection<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} required /><small>{Array.from(body).length} / 2,000 characters</small></label>
            <label className="honeypot-field" aria-hidden="true">Leave this field empty<input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
            <p className="comment-status">By submitting, you agree to our <Link href="/policies/community-guidelines/">Community Guidelines</Link> and <Link href="/policies/terms/">Terms of Service</Link>. Read our <Link href="/policies/privacy/">Privacy Policy</Link>.</p>
            <button className="button button-gold" type="submit" disabled={sending}>{sending ? "Sending…" : "Submit for review"}</button>
          </form>
        </>
      )}
    </section>
  );
}
