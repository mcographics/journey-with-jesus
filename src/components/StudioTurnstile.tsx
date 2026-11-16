"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    theme: "auto";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

// Cloudflare's public site key is safe in the browser. The secret belongs only in Supabase Auth.
export function StudioTurnstile({
  siteKey, onToken, resetCounter,
}: {
  siteKey: string; onToken: (token: string) => void; resetCounter: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { callback.current = onToken; }, [onToken]);

  useEffect(() => {
    let active = true;
    const render = () => {
      if (!active || !container.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token) => { if (active) callback.current(token); },
        "expired-callback": () => { if (active) callback.current(""); },
        "error-callback": () => { if (active) { callback.current(""); setLoadError(true); } },
      });
    };
    const src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    let script = document.querySelector<HTMLScriptElement>('script[data-studio-turnstile="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.dataset.studioTurnstile = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    script.addEventListener("error", () => { if (active) setLoadError(true); });
    render();
    return () => {
      active = false;
      script?.removeEventListener("load", render);
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
      callback.current("");
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetCounter > 0 && widgetId.current) {
      callback.current("");
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetCounter]);

  return (
    <div className="studio-captcha" aria-label="Human verification">
      <div ref={container} />
      {loadError && <p className="studio-notice is-error" role="alert">Human verification could not load. Disable script blockers for this site and reload.</p>}
    </div>
  );
}
