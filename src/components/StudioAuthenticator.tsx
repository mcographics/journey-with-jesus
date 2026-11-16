"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type StudioClient = NonNullable<ReturnType<typeof createBrowserSupabaseClient>>;

type VerifiedTotpFactor = { id: string; friendly_name?: string | null; status: string };

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Authentication could not be completed. Please try again.";
}

// This is always a second factor, never an alternative to initial Magic Link or passkey sign-in.
export function StudioMfaChallenge({
  client, onVerified, onSignOut,
}: {
  client: StudioClient; onVerified: () => void; onSignOut: () => void;
}) {
  const [factors, setFactors] = useState<VerifiedTotpFactor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;
    void client.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorText(error.message);
      const verified = (data?.totp ?? []).filter((item) => item.status === "verified");
      setFactors(verified);
      setFactorId(verified[0]?.id ?? "");
      setLoading(false);
    }).catch((error: unknown) => {
      if (active) { setErrorText(message(error)); setLoading(false); }
    });
    return () => { active = false; };
  }, [client]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setErrorText("");
    try {
      const result = await client.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (assurance.data.currentLevel !== "aal2") throw new Error("Additional verification was not confirmed. Please retry.");
      setCode("");
      onVerified();
    } catch (error) {
      setErrorText(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="studio-page studio-login-page">
      <section className="studio-gate studio-login-card" aria-labelledby="studio-mfa-heading">
        <span className="studio-mark" aria-hidden="true">✓</span>
        <p className="media-kicker">KERYGMA CREATIVE HQ / SECOND STEP</p>
        <h1 id="studio-mfa-heading">Microsoft Authenticator</h1>
        <p>To unlock your administrator account, enter the six-digit code from Microsoft Authenticator.</p>
        {errorText && <p className="studio-notice is-error" role="alert">{errorText}</p>}
        {loading ? <p role="status">Loading your security factors…</p> : factors.length === 0
          ? <p role="alert">No verified authenticator is available for this account. Contact a project administrator for account recovery.</p>
          : <form className="studio-sign-in" onSubmit={verify}>
              {factors.length > 1 && <label>Authenticator
                <select value={factorId} onChange={(event) => setFactorId(event.target.value)}>
                  {factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || "Authenticator"}</option>)}
                </select>
              </label>}
              <label>Six-digit verification code
                <input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" required />
              </label>
              <button className="button button-gold" type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify and enter Studio"}
              </button>
            </form>}
        <button type="button" className="button button-outline" onClick={onSignOut}>Sign out and use another account</button>
      </section>
    </main>
  );
}

export function StudioMfaEnrollment({
  client, onEnabled,
}: {
  client: StudioClient; onEnabled: () => void;
}) {
  const [verified, setVerified] = useState<VerifiedTotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) throw error;
    setVerified((data?.totp ?? []).filter((item) => item.status === "verified"));
    setLoading(false);
  }, [client]);

  useEffect(() => {
    let active = true;
    void refresh().catch((error: unknown) => {
      if (active) { setNotice(message(error)); setIsError(true); setLoading(false); }
    });
    return () => { active = false; };
  }, [refresh]);

  async function start() {
    setBusy(true); setNotice(""); setIsError(false);
    try {
      const { data, error } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Microsoft Authenticator" });
      if (error) throw error;
      if (!data?.totp) throw new Error("Supabase did not provide an authenticator QR code.");
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setCode("");
    } catch (error) {
      setNotice(message(error)); setIsError(true);
    } finally { setBusy(false); }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true); setNotice(""); setIsError(false);
    try {
      const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      setFactorId(""); setQr(""); setSecret(""); setCode("");
      await refresh();
      setNotice("Microsoft Authenticator is enabled. Future Studio sign-ins will require your six-digit code.");
      onEnabled();
    } catch (error) {
      setNotice(message(error)); setIsError(true);
    } finally { setBusy(false); }
  }

  async function cancel() {
    setBusy(true);
    try {
      if (factorId) {
        const { error } = await client.auth.mfa.unenroll({ factorId });
        if (error) throw error;
      }
      setFactorId(""); setQr(""); setSecret(""); setCode("");
      setNotice("");
    } catch (error) {
      setNotice(message(error)); setIsError(true);
    } finally { setBusy(false); }
  }

  return (
    <section className="studio-panel studio-form studio-mfa-settings" aria-labelledby="studio-mfa-settings-title">
      <h2 id="studio-mfa-settings-title">Microsoft Authenticator</h2>
      <p>Add an extra verification step to your private Studio account using a six-digit code. This works with Microsoft Authenticator and other standard TOTP apps. Keep your existing Magic Link and passkey sign-in methods.</p>
      {notice && <p className={"studio-notice" + (isError ? " is-error" : "")} role="status">{notice}</p>}
      {loading ? <p>Checking authenticator setup…</p> : verified.length > 0 && <p role="status">Authenticator enabled: {verified.map((factor) => factor.friendly_name || "Authenticator").join(", ")}</p>}
      {!loading && !factorId && verified.length === 0 &&
        <button type="button" className="button button-outline" disabled={busy} onClick={() => void start()}>
          {busy ? "Preparing…" : "Set up Microsoft Authenticator"}
        </button>}
      {!loading && factorId && (
        <div className="studio-mfa-enrollment">
          <p><strong>1.</strong> In Microsoft Authenticator, choose Add account → Other account and scan this QR code.</p>
          {qr.startsWith("data:image/") && <img className="studio-mfa-qr" src={qr} alt="Authenticator setup QR code (private)" />}
          <p>If you cannot scan, enter this setup key manually. Do not share this key.</p>
          <code className="studio-mfa-secret">{secret}</code>
          <form className="studio-sign-in" onSubmit={confirm}>
            <label><strong>2.</strong> Enter the six-digit code shown in the app
              <input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required placeholder="000000" />
            </label>
            <button className="button button-gold" type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify and enable"}
            </button>
            <button type="button" className="button button-outline" disabled={busy} onClick={() => void cancel()}>Cancel setup</button>
          </form>
        </div>
      )}
      <small>For account recovery, keep a secure backup of your authenticator setup. Never share the QR code or secret with other people.</small>
    </section>
  );
}
