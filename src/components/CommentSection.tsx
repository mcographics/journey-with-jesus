"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownUp, MessageCircle, UserRound } from "lucide-react";
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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!episodeId || !configured) return;
    let active = true;
    const client = createBrowserSupabaseClient();
    if (!client) return;
    void client.from("episode_comments").select("id, episode_id, display_name, body, status, created_at")
      .eq("episode_id", episodeId).eq("status", "approved").order("created_at", { ascending: sortOrder === "oldest" }).limit(50)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setIsError(true); setStatus("Comments are temporarily unavailable. Please try again later."); return; }
        setComments(data ?? []);
      });
    return () => { active = false; };
  }, [episodeId, configured, sortOrder]);

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

  const sortedComments = [...comments].sort((first, second) =>
    (sortOrder === "newest" ? -1 : 1) *
    (Date.parse(first.created_at) - Date.parse(second.created_at)),
  );

  const heading = title ?? (general ? "Media community" : "Story comments");
  const headingId = general ? "media-community-title" : "episode-comments-title";

  return (
    <section className="comment-section" aria-labelledby={headingId}>
      <div className="comment-section-heading">
        <div className="comment-section-title">
          <MessageCircle size={24} strokeWidth={1.8} aria-hidden="true" />
          <h2 id={headingId}>{heading}</h2>
          {configured && episodeId && <span className="comment-total">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span>}
        </div>
        {configured && episodeId && comments.length > 1 && (
          <label className="comment-sort">
            <ArrowDownUp size={16} aria-hidden="true" />
            <span>Sort by</span>
            <select aria-label="Sort comments" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        )}
      </div>
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
          <form className="comment-form" onSubmit={submitComment}>
            <span className="comment-composer-avatar" aria-hidden="true"><UserRound size={22} /></span>
            <div className="comment-composer-main">
              <p className="comment-composer-heading">Add a comment</p>
              <div className="comment-composer-fields">
                <label>Display name
                  <input value={name} onChange={(event) => setName(event.target.value)}
                    maxLength={60} autoComplete="nickname" placeholder="How should we call you?" required />
                </label>
                <label>Your reflection
                  <textarea value={body} onChange={(event) => setBody(event.target.value)}
                    maxLength={2000} rows={3} placeholder="Share your thoughts…" required />
                </label>
              </div>
              <div className="comment-composer-actions">
                <small>{Array.from(body).length} / 2,000 characters</small>
                <div className="comment-composer-buttons">
                  <button className="comment-cancel" type="button" disabled={sending}
                    onClick={() => { setName(""); setBody(""); setStatus(""); setIsError(false); }}>Cancel</button>
                  <button className="button button-gold" type="submit" disabled={sending}>
                    {sending ? "Sending…" : "Submit for review"}
                  </button>
                </div>
              </div>
              <label className="honeypot-field" aria-hidden="true">Leave this field empty
                <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
              <p className="comment-policy">Comments appear after review. By submitting, you agree to our <Link href="/policies/community-guidelines/">Community Guidelines</Link> and <Link href="/policies/terms/">Terms of Service</Link>. Read our <Link href="/policies/privacy/">Privacy Policy</Link>.</p>
            </div>
          </form>
          <div className="comment-list" aria-live="polite">
            {sortedComments.length === 0 ? (
              <div className="comment-empty">
                <MessageCircle size={22} strokeWidth={1.6} aria-hidden="true" />
                <p>No comments yet. Be the first to share a reflection.</p>
              </div>
            ) : sortedComments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <span className="comment-avatar" aria-hidden="true">{comment.display_name.trim().charAt(0).toUpperCase() || "?"}</span>
                <div className="comment-content">
                  <div className="comment-byline">
                    <strong>{comment.display_name}</strong>
                    <time dateTime={comment.created_at} title={new Date(comment.created_at).toLocaleString()}>
                      {formatCommentAge(comment.created_at)}
                    </time>
                  </div>
                  <p>{comment.body}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function formatCommentAge(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : minutes + " minutes ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : hours + " hours ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : days + " days ago";
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : months + " months ago";
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : years + " years ago";
}
