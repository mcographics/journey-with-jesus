"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";

type SignupState = "idle" | "sending" | "success" | "error" | "limited";

export function NewsletterSignup() {
  const emailId = useId();
  const consentId = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<SignupState>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      setStatus("error");
      return;
    }

    const { error } = await supabase.functions.invoke("newsletter-signup", {
      body: { email: email.trim(), consent, website },
    });

    if (error) {
      const context = typeof error === "object" && error !== null && "context" in error
        ? error.context
        : null;
      setStatus(context instanceof Response && context.status === 429 ? "limited" : "error");
      return;
    }

    setStatus("success");
    setEmail("");
    setConsent(false);
  };

  const message = status === "success"
    ? "If this address can be subscribed, check your inbox for a confirmation email."
    : status === "limited"
      ? "Please wait a little while before trying again."
      : status === "error"
        ? "Signups are temporarily unavailable. Please try again later."
        : "";

  return (
    <section aria-labelledby={`${emailId}-heading`} className="footer-newsletter">
      <div className="footer-newsletter-heading">
        <Mail aria-hidden="true" size={18} />
        <div>
          <h2 id={`${emailId}-heading`}>Journey with Jesus updates</h2>
          <p>New animated stories and project news, delivered occasionally.</p>
        </div>
      </div>
      <form className="newsletter-form" onSubmit={submit}>
        <label className="visually-hidden" htmlFor={emailId}>Email address</label>
        <input
          autoComplete="email"
          disabled={status === "sending" || status === "success"}
          id={emailId}
          maxLength={254}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          required
          type="email"
          value={email}
        />
        <button disabled={status === "sending" || status === "success"} type="submit">
          <span>{status === "sending" ? "Joining…" : "Sign up"}</span>
          <ArrowRight aria-hidden="true" size={16} />
        </button>
        <label aria-hidden="true" className="newsletter-honeypot" htmlFor={`${emailId}-website`}>
          Leave this field empty
        </label>
        <input
          autoComplete="off"
          className="newsletter-honeypot"
          id={`${emailId}-website`}
          name="website"
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          value={website}
        />
        <div className="newsletter-consent">
          <input
            checked={consent}
            disabled={status === "sending" || status === "success"}
            id={consentId}
            name="consent"
            onChange={(event) => setConsent(event.target.checked)}
            required
            type="checkbox"
          />
          <label htmlFor={consentId}>
            I agree to receive email updates from Journey with Jesus. I can unsubscribe at any time.
          </label>
        </div>
      </form>
      <p aria-live="polite" className={`newsletter-status${status === "error" || status === "limited" ? " is-error" : ""}`} role="status">
        {message}
      </p>
    </section>
  );
}
