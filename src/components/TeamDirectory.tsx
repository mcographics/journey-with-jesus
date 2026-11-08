"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type TeamMember = Pick<Database["public"]["Tables"]["media_team_members"]["Row"], "id" | "name" | "role" | "bio" | "role_fr" | "bio_fr" | "role_es" | "bio_es" | "profile_image_url" | "sort_order">;

type Props = { fallbackMembers: TeamMember[] };

function useTeamLanguage() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("site-language-change", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("site-language-change", onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      try {
        const saved = window.localStorage.getItem("kerygmapath-language");
        return saved === "fr" || saved === "es" ? saved : "en";
      } catch {
        return "en";
      }
    },
    () => "en",
  );
}

export function TeamDirectory({ fallbackMembers }: Props) {
  const language = useTeamLanguage();
  const [members, setMembers] = useState<TeamMember[]>(fallbackMembers);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const client = createBrowserSupabaseClient();
      if (!client) {
        setLoaded(true);
        return;
      }

      void Promise.resolve(client.from("media_team_members")
        .select("id, name, role, bio, role_fr, bio_fr, role_es, bio_es, profile_image_url, sort_order")
        .order("sort_order")
        .order("name"))
        .then(({ data, error }) => {
          if (!active) return;
          if (!error && data) setMembers(data);
          setLoaded(true);
        })
        .catch(() => {
          if (active) setLoaded(true);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section aria-label="Journey with Jesus team" className="team-grid" aria-busy={!loaded}>
      {/* Mobile reserves the expanded height separately from the compact visible portrait list.
          This keeps the footer anchored without inserting large gaps between closed portraits. */}
      <div className="team-grid-mobile-footprint" aria-hidden="true" inert>
        {members.map((member) => {
          const role = language === "fr" ? member.role_fr || member.role : language === "es" ? member.role_es || member.role : member.role;
          const bio = language === "fr" ? member.bio_fr || member.bio : language === "es" ? member.bio_es || member.bio : member.bio;
          return (
            <div className="team-profile-space" key={member.id}>
              <div className="team-profile-photo-space" />
              <div className="team-card-copy">
                <p className="team-role">{role || (language === "fr" ? "Membre de l’équipe" : language === "es" ? "Miembro del equipo" : "Team member")}</p>
                <h2>{member.name}</h2>
                {bio && <p>{bio}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="team-profile-list">
      {members.map((member) => {
        const role = language === "fr" ? member.role_fr || member.role : language === "es" ? member.role_es || member.role : member.role;
        const bio = language === "fr" ? member.bio_fr || member.bio : language === "es" ? member.bio_es || member.bio : member.bio;
        const initials = member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
        return (
          <div className="team-profile-slot" key={member.id}>
            <div className="team-profile-space" aria-hidden="true" inert>
              <div className="team-profile-photo-space" />
              <div className="team-card-copy">
                <p className="team-role">{role || (language === "fr" ? "Membre de l’équipe" : language === "es" ? "Miembro del equipo" : "Team member")}</p>
                <h2>{member.name}</h2>
                {bio && <p>{bio}</p>}
              </div>
            </div>
          <details className="team-card team-profile">
            <summary className="team-profile-toggle">
              <span className="visually-hidden">View profile: {member.name}</span>
            <div className={`team-art${member.profile_image_url ? " has-photo" : ""}`}>
              {!member.profile_image_url && <span className="team-art-label">{role || "Journey with Jesus"}</span>}
              {!member.profile_image_url && <span className="team-monogram" aria-hidden="true">{initials}</span>}
              {!member.profile_image_url && <Sparkles className="team-art-mark" size={27} strokeWidth={1.2} aria-hidden="true" />}
              {member.profile_image_url && <Image className="team-photo" src={member.profile_image_url} alt={"Portrait of " + member.name} fill sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 34vw" unoptimized onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </div>
            </summary>
            <div className="team-card-copy">
              <p className="team-role">{role || (language === "fr" ? "Membre de l’équipe" : language === "es" ? "Miembro del equipo" : "Team member")}</p>
              <h2>{member.name}</h2>
              {bio && <p>{bio}</p>}
            </div>
          </details>
          <div className="team-profile-mobile-caption">
            <p className="team-profile-mobile-name">{member.name}</p>
            <p className="team-profile-mobile-prompt">Tap circle to read more</p>
          </div>
          </div>
        );
      })}
      {loaded && members.length === 0 && <p className="team-empty">Team profiles are being prepared. Please check back soon.</p>}
      </div>
    </section>
  );
}
