"use client";

import { useEffect, useId, useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTERED_SITE_KEY } from "@/components/EnterSiteLink";
import Script from "next/script";
import { Mail } from "lucide-react";
import { PRIVACY_EVENT, readExternalConsent } from "@/components/PrivacyPreferences";

const REACH_FORM_ID = "46169614-b34a-4128-9bb0-2dc232611bbe";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const CUSTOM_ENDPOINT = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/reach-newsletter-signup`
  : "";

/** The existing Reach embed remains live until a secure API connection is enabled.
 * The new form is entirely styled by the Kerygma Path website, not Reach's iframe.
 * Never put a Hostinger API token in this component or any NEXT_PUBLIC_ variable.
 */
export function NewsletterSignup() {
  const headingId = useId();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname === "/") return;
    let eligible = false;
    try {
      eligible = sessionStorage.getItem(ENTERED_SITE_KEY) === "yes"
        && sessionStorage.getItem("kerygma-newsletter-prompted-v1") !== "yes";
    } catch { return; }
    if (!eligible) return;
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem("kerygma-newsletter-prompted-v1", "yes"); } catch {}
      setModalOpen(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
      if (event.key === "Tab") {
        const dialog = document.getElementById("kerygma-newsletter-dialog");
        const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"])') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [modalOpen]);

  const statusId = useId();
  const [customReady, setCustomReady] = useState(false);
  const [externalAllowed, setExternalAllowed] = useState(false);
  useEffect(() => {
    const refresh = () => setExternalAllowed(readExternalConsent());
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(PRIVACY_EVENT, refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener(PRIVACY_EVENT, refresh); };
  }, []);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!CUSTOM_ENDPOINT || !PUBLISHABLE_KEY) return;
    let active = true;

    // Only show our own signup form after the backend confirms that it is
    // configured. Until then, Hostinger's working hosted form stays in place.
    fetch(CUSTOM_ENDPOINT, {
      method: "GET",
      headers: { apikey: PUBLISHABLE_KEY },
      cache: "no-store",
    })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: { ready?: boolean } | null) => {
        if (active && data?.ready === true) setCustomReady(true);
      })
      .catch(() => { /* Keep the existing embed when the API is unavailable. */ });

    return () => { active = false; };
  }, []);

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || sending || !CUSTOM_ENDPOINT || !PUBLISHABLE_KEY) return;

    setSending(true);
    setMessage("");
    setError(false);
    try {
      const website = (event.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value ?? "";
      const response = await fetch(CUSTOM_ENDPOINT, {
        method: "POST",
        headers: {
          apikey: PUBLISHABLE_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, firstName, consent, website }),
      });
      if (!response.ok) {
        setError(true);
        setMessage(response.status === 429
          ? "Too many attempts. Please try again later."
          : "We couldn't submit your request right now. Please try again later.");
        if (response.status === 503) setCustomReady(false);
        return;
      }
      setEmail("");
      setFirstName("");
      setConsent(false);
      setMessage("Thank you! If email confirmation is required, please check your inbox.");
    } catch {
      setError(true);
      setMessage("We couldn't connect right now. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" className="footer-newsletter-launch" onClick={() => setModalOpen(true)}>
        <Mail aria-hidden="true" size={18} /> Sign up for updates
      </button>
      {modalOpen && (
      <div className="newsletter-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
      <section id="kerygma-newsletter-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId} className="newsletter-modal">
        <button ref={closeButtonRef} type="button" className="newsletter-modal-close" aria-label="Close newsletter signup" onClick={() => setModalOpen(false)}>×</button>
        <div className="footer-newsletter">
      <div className="footer-newsletter-heading">
        <Mail aria-hidden="true" size={18} />
        <div>
          <h2 id={headingId}>Kerygma Path updates</h2>
          <p>New animated stories and project news, delivered occasionally.</p>
        </div>
      </div>

      {customReady ? (
        <form
          className="footer-custom-newsletter"
          onSubmit={submitSignup}
          aria-describedby={message ? statusId : undefined}
        >
          <div className="footer-custom-newsletter-fields">
            <label className="visually-hidden" htmlFor="newsletter-first-name">First name (optional)</label>
            <input
              id="newsletter-first-name"
              className="footer-custom-newsletter-input"
              type="text"
              autoComplete="given-name"
              maxLength={80}
              placeholder="First name (optional)"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <div className="footer-custom-newsletter-email-row">
              <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
              <input
                id="newsletter-email"
                className="footer-custom-newsletter-input"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="Email address"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className="footer-custom-newsletter-submit" type="submit" disabled={sending || !consent}>
                {sending ? "Subscribing…" : "Subscribe"}
              </button>
            </div>
          </div>
          <input
            aria-hidden="true"
            className="newsletter-honeypot"
            tabIndex={-1}
            name="website"
            type="text"
            autoComplete="off"
          />
          <label className="footer-custom-newsletter-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span className="footer-custom-newsletter-consent-copy">
              I agree to receive occasional email updates from Kerygma Path.
              I can unsubscribe at any time. See the{" "}
              <Link href="/policies/privacy/">Privacy Policy</Link>.
            </span>
          </label>
          {message && (
            <p id={statusId} role={error ? "alert" : "status"}
              className={`footer-custom-newsletter-status${error ? " is-error" : ""}`}>
              {message}
            </p>
          )}
        </form>
      ) : externalAllowed ? (
        <>
          <div
            className="footer-reach-form"
            data-reach-form={REACH_FORM_ID}
            style={{ width: "100%" }}
          />
          <Script
            id="hostinger-reach-embed"
            src="https://cdn-reach.hostinger.com/js/embed.js"
            strategy="afterInteractive"
          />
        </>
      ) : (
        <p className="footer-newsletter-privacy-note">To load the external newsletter form, choose “Allow external services” under Privacy preferences. You can change this choice at any time.</p>
      )}
        </div>
      </section>
      </div>
      )}
    </>
  );
}
