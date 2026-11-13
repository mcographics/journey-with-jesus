"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export const PRIVACY_STORAGE_KEY = "kerygma-privacy-consent-v1";
export const PRIVACY_EVENT = "kerygma-privacy-changed";
type Consent = { external: boolean; savedAt: string };

export function readExternalConsent(): boolean {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw) as Consent;
    return consent.external === true;
  } catch { return false; }
}

export function PrivacyPreferences() {
  const [open, setOpen] = useState(false);
  const [decided, setDecided] = useState(true);
  const [external, setExternal] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
        setDecided(Boolean(raw));
        setExternal(readExternalConsent());
      } catch { setDecided(false); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function save(allow: boolean) {
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ external: allow, savedAt: new Date().toISOString() }));
    } catch { /* Browser storage may be disabled. Do not enable optional services. */ }
    const granted = readExternalConsent();
    setExternal(granted);
    setDecided(true);
    setOpen(false);
    window.dispatchEvent(new Event(PRIVACY_EVENT));
  }

  return (
    <div className="privacy-preferences">
      <button type="button" className="privacy-preferences-trigger" onClick={() => setOpen(true)}>
        <ShieldCheck aria-hidden="true" size={16} /> Privacy preferences
      </button>
      {!decided && <p className="privacy-preferences-hint">Optional external content is off until you choose.</p>}
      {open && (
        <div className="privacy-preferences-backdrop">
          <section className="privacy-preferences-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-dialog-heading" aria-describedby="privacy-dialog-description">
            <h2 id="privacy-dialog-heading">Privacy preferences</h2>
            <p id="privacy-dialog-description">Essential browser preferences and site security remain available. Optional third-party newsletter embeds may connect to external services and use their own storage. Choose whether to allow them.</p>
            <p><strong>Essential:</strong> Always active (site operation, security and saved accessibility choices).</p>
            <p><strong>External services:</strong> {external ? "Currently allowed" : "Currently disabled"}.</p>
            <div className="privacy-preferences-actions">
              <button type="button" onClick={() => save(false)}>Reject optional</button>
              <button type="button" onClick={() => save(true)}>Allow external services</button>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </div>
            <p className="privacy-preferences-small">You can change your choice here at any time. This setting controls the optional Hostinger Reach embed; other third-party features require a separate audit.</p>
          </section>
        </div>
      )}
    </div>
  );
}
