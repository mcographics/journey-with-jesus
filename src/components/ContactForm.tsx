"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const CONTACT_ENDPOINT = SUPABASE_URL ? SUPABASE_URL + "/functions/v1/contact-inquiry" : "";

type Availability = "checking" | "ready" | "unavailable";

export function ContactForm() {
  const statusId = useId();
  const [availability, setAvailability] = useState<Availability>("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CONTACT_ENDPOINT || !PUBLISHABLE_KEY) {
      const id = window.setTimeout(() => setAvailability("unavailable"), 0);
      return () => window.clearTimeout(id);
    }
    const controller = new AbortController();
    // A stalled health check must not leave the status pending indefinitely.
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      setAvailability("unavailable");
    }, 9000);
    fetch(CONTACT_ENDPOINT, {
      method: "GET",
      headers: { apikey: PUBLISHABLE_KEY },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ ready?: boolean }> : null)
      .then((result) => {
        if (!controller.signal.aborted) setAvailability(result?.ready === true ? "ready" : "unavailable");
      })
      .catch(() => { if (!controller.signal.aborted) setAvailability("unavailable"); })
      .finally(() => window.clearTimeout(timeoutId));
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !consent) return;
    if (!CONTACT_ENDPOINT || !PUBLISHABLE_KEY) {
      setFailed(true);
      setFeedback("The message service is not configured. Your message was not sent; please try again later.");
      return;
    }
    setSending(true);
    setFeedback("");
    setFailed(false);

    const form = event.currentTarget;
    const website = (form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { apikey: PUBLISHABLE_KEY, "content-type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, consent, website }),
      });
      if (response.status === 202) {
        setAvailability("ready");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setConsent(false);
        setFeedback("Thank you. Your message has been submitted to Kerygma Path.");
      } else {
        setFailed(true);
        setFeedback(response.status === 429
          ? "Too many messages have been submitted. Please try again later."
          : response.status === 503
            ? "The contact service is unavailable. Your message was not sent; your text has been kept so you can try again."
            : "Your message could not be sent. Please try again later.");
        if (response.status === 503) setAvailability("unavailable");
      }
    } catch {
      setFailed(true);
      setFeedback("We could not connect to the message service. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-busy={sending} aria-describedby={feedback ? statusId : undefined}>
      <div className="contact-form-row">
        <label htmlFor="contact-name">Your name
          <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100}
            required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name"
            disabled={sending} />
        </label>
        <label htmlFor="contact-email">Email address
          <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254}
            required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"
            disabled={sending} />
        </label>
      </div>
      <label htmlFor="contact-subject">Subject
        <input id="contact-subject" name="subject" type="text" maxLength={150}
          required value={subject} onChange={(event) => setSubject(event.target.value)}
          placeholder="How can we help?" disabled={sending} />
      </label>
      <label htmlFor="contact-message">Your message
        <textarea id="contact-message" name="message" rows={7} minLength={10} maxLength={4000}
          required value={message} onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message here…" disabled={sending} />
      </label>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="contact-consent">
        <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)}
          disabled={sending} />
        <span>I agree to have my information used to respond to this inquiry, as described in the <Link href="/policies/privacy/">Privacy Policy</Link>.</span>
      </label>
      {availability === "checking" && <p className="contact-service-note" role="status">Checking the message service. You can fill in the form while we connect.</p>}
      {availability === "unavailable" && <p className="contact-service-note" role="status">The message service could not be verified. You can still prepare your message, but sending might fail until the service is restored.</p>}
      {feedback && <p id={statusId} className={failed ? "contact-feedback is-error" : "contact-feedback"}
        role={failed ? "alert" : "status"}>{feedback}</p>}
      <button className="contact-submit" type="submit" disabled={sending}>
        {sending ? "Sending message…" : "Send message"}
      </button>
    </form>
  );
}
