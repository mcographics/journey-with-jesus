"use client";

import { useId } from "react";
import Script from "next/script";
import { Mail } from "lucide-react";

const REACH_FORM_ID = "46169614-b34a-4128-9bb0-2dc232611bbe";

/**
 * The public footer signup is managed by Hostinger Reach.
 * Reach handles the contact list and double opt-in email; do not submit
 * this form to the legacy Brevo/Supabase newsletter-signup function.
 */
export function NewsletterSignup() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="footer-newsletter">
      <div className="footer-newsletter-heading">
        <Mail aria-hidden="true" size={18} />
        <div>
          <h2 id={headingId}>Journey with Jesus updates</h2>
          <p>New animated stories and project news, delivered occasionally.</p>
        </div>
      </div>

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
    </section>
  );
}
