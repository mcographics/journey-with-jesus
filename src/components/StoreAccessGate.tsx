"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { ShoppingBag } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function StoreAccessGate({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;

    let active = true;
    const verifyAdmin = async (session: Session | null) => {
      if (!session) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data, error } = await client
        .from("media_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (active) setIsAdmin(!error && Boolean(data));
    };

    void client.auth.getSession()
      .then(({ data }) => verifyAdmin(data.session))
      .catch(() => {
        if (active) setIsAdmin(false);
      });

    const { data: authData } = client.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(false);
      window.setTimeout(() => void verifyAdmin(session), 0);
    });

    return () => {
      active = false;
      authData.subscription.unsubscribe();
    };
  }, []);

  if (isAdmin) return <>{children}</>;

  return (
    <main className="editorial-page store-page store-page-v2" id="main-content">
      <section aria-labelledby="store-unavailable-title" className="store-unavailable-card">
        <div aria-hidden="true" className="store-unavailable-icon">
          <ShoppingBag size={28} strokeWidth={1.45} />
        </div>
        <p className="store-section-eyebrow">Kerygma Path Store</p>
        <h1 className="store-unavailable-title" id="store-unavailable-title">
          The store is not available yet.
        </h1>
        <p className="store-unavailable-description">
          This space is not open to visitors yet. Please check back later.
        </p>
      </section>
    </main>
  );
}
