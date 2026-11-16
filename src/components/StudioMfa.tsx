"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { StudioDigitalRain } from "@/components/StudioDigitalRain";

type StudioClient = NonNullable<ReturnType<typeof createBrowserSupabaseClient>>;
type Factor = { id: string; status: string; friendly_name?: string | null };
type PendingEnrollment = { id: string; qr: string; secret: string };

function sixDigitCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function StudioMfaGate({ client, onVerified, onSignOut }: {
  client: StudioClient;
  onVerified: () => void;
  onSignOut: () => void;
}) {
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void client.auth.mfa.listFactors().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) { setError(loadError.message); return; }
      const verified = data.totp.find((factor) => factor.status === "verified");
      if (!verified) { setError("No verified authenticator was found for this account. Contact the Studio administrator."); return; }
      setFactorId(verified.id);
    });
    return () => { active = false; };
  }, [client]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const { error: verifyError } = await client.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      const { data, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError || data.currentLevel !== "aal2") throw new Error("Authenticator verification did not finish. Please retry.");
      setCode("");
      onVerified();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="studio-page studio-login-page">
      <StudioDigitalRain />
      <section className="studio-gate studio-login-card studio-mfa-gate" aria-labelledby="studio-mfa-title">
        <span className="studio-mark"><ShieldCheck size={23} /></span>
        <h1 id="studio-mfa-title">Verify with Microsoft Authenticator</h1>
        <p>This administrator account has opted into extra verification. Enter the six-digit code from your authenticator app to continue into Creative HQ.</p>
        <form className="studio-sign-in" onSubmit={(event) => void verify(event)}>
          <label>Six-digit verification code
            <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={code} onChange={(event) => setCode(sixDigitCode(event.target.value))} placeholder="000000" required />
          </label>
          <button type="submit" className="button button-gold" disabled={busy || !factorId || code.length !== 6}>
            {busy ? <LoaderCircle className="studio-spin" size={16} /> : <ShieldCheck size={16} />}
            {busy ? "Verifying…" : "Verify and enter Studio"}
          </button>
        </form>
        {error && <p role="alert" className="studio-notice is-error">{error}</p>}
        <button className="button button-outline studio-mfa-signout" type="button" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  );
}

export function StudioMfaSettings({ client, onNotice }: {
  client: StudioClient;
  onNotice: (message: string, isError?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    void client.auth.mfa.listFactors().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setFactors(data.totp.filter((item) => item.status === "verified"));
    });
    return () => { active = false; };
  }, [open, client]);

  async function refreshFactors() {
    const { data, error: loadError } = await client.auth.mfa.listFactors();
    if (loadError) throw loadError;
    setFactors(data.totp.filter((factor) => factor.status === "verified"));
  }

  async function beginEnrollment() {
    if (busy) return;
    setBusy(true); setError(""); setLoading(true);
    try {
      const { data, error: enrollError } = await client.auth.mfa.enroll({
        factorType: "totp", friendlyName: "Microsoft Authenticator"
      });
      if (enrollError) throw enrollError;
      if (!data.totp?.qr_code || !data.totp.secret) throw new Error("Could not prepare the authenticator QR code.");
      setPending({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authenticator enrollment failed.");
    } finally { setBusy(false); setLoading(false); }
  }

  async function finishEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || code.length !== 6 || busy) return;
    setBusy(true); setError("");
    try {
      const { error: verifyError } = await client.auth.mfa.challengeAndVerify({ factorId: pending.id, code });
      if (verifyError) throw verifyError;
      setPending(null); setCode("");
      await refreshFactors();
      onNotice("Microsoft Authenticator enabled. Future sign-ins will require its six-digit code.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code did not verify.");
    } finally { setBusy(false); }
  }

  async function disableFactor(factorId: string) {
    if (!window.confirm("Remove this authenticator? This will reduce account security if it is your last verified factor.")) return;
    setBusy(true); setError("");
    try {
      const { error: removeError } = await client.auth.mfa.unenroll({ factorId });
      if (removeError) throw removeError;
      await refreshFactors();
      onNotice("Authenticator removed from your account.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove this authenticator.");
    } finally { setBusy(false); }
  }

  return (
    <div className="studio-mfa-settings">
      <button className="button button-outline" type="button" aria-expanded={open}
        onClick={() => { setOpen((current) => !current); setError(""); }}>
        <ShieldCheck size={15} />Authenticator
      </button>
      {open && (
        <section className="studio-mfa-panel" aria-label="Microsoft Authenticator settings">
          <h2>Microsoft Authenticator</h2>
          <p>Optional for approved Studio administrators. Once activated, you will enter a six-digit code after Magic Link or passkey sign-in.</p>
          {factors.map((factor) => (
            <div className="studio-mfa-factor" key={factor.id}>
              <span>{factor.friendly_name || "Authenticator"} — enabled</span>
              <button className="button button-outline" type="button" disabled={busy}
                onClick={() => void disableFactor(factor.id)}>Remove</button>
            </div>
          ))}
          {!pending && (
            <button type="button" className="button button-outline" disabled={busy || loading}
              onClick={() => void beginEnrollment()}>
              {busy ? "Preparing…" : factors.length ? "Add backup authenticator" : "Set up Microsoft Authenticator"}
            </button>
          )}
          {pending && (
            <form className="studio-mfa-enroll" onSubmit={(event) => void finishEnrollment(event)}>
              <p>On your phone, open Microsoft Authenticator, add an account, and choose to scan a QR code.</p>
              <Image src={pending.qr} alt="QR code to register this authenticator" width={184} height={184} unoptimized />
              <details><summary>Can't scan the code? Enter setup key manually</summary>
                <code>{pending.secret}</code>
              </details>
              <label>Six-digit code from the app
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                  value={code} onChange={(event) => setCode(sixDigitCode(event.target.value))} placeholder="000000" required />
              </label>
              <button className="button button-gold" type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify and enable"}
              </button>
              <button className="button button-outline" type="button" disabled={busy}
                onClick={() => { setPending(null); setCode(""); }}>Cancel setup</button>
            </form>
          )}
          <p className="studio-mfa-advice">Supabase does not supply recovery codes. For reliable recovery, register a backup authenticator on another device before relying on this extra protection.</p>
          {error && <p role="alert" className="studio-notice is-error">{error}</p>}
        </section>
      )}
    </div>
  );
}
