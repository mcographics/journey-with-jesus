"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type TeamMember = Pick<Database["public"]["Tables"]["media_team_members"]["Row"], "id" | "name" | "role" | "bio" | "profile_image_url" | "sort_order">;

type Props = { fallbackMembers: TeamMember[] };

export function TeamDirectory({ fallbackMembers }: Props) {
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
        .select("id, name, role, bio, profile_image_url, sort_order")
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
      {members.map((member) => {
        const initials = member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
        return (
          <details className="team-card team-profile" key={member.id}>
            <summary className="team-profile-toggle">
              <span className="visually-hidden">View profile: {member.name}</span>
            <div className={`team-art${member.profile_image_url ? " has-photo" : ""}`}>
              {!member.profile_image_url && <span className="team-art-label">{member.role || "Journey with Jesus"}</span>}
              {!member.profile_image_url && <span className="team-monogram" aria-hidden="true">{initials}</span>}
              {!member.profile_image_url && <Sparkles className="team-art-mark" size={27} strokeWidth={1.2} aria-hidden="true" />}
              {member.profile_image_url && <Image className="team-photo" src={member.profile_image_url} alt={"Portrait of " + member.name} fill sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 34vw" unoptimized onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </div>
            </summary>
            <div className="team-card-copy">
              <p className="team-role">{member.role || "Team member"}</p>
              <h2>{member.name}</h2>
              {member.bio && <p>{member.bio}</p>}
            </div>
          </details>
        );
      })}
      {loaded && members.length === 0 && <p className="team-empty">Team profiles are being prepared. Please check back soon.</p>}
    </section>
  );
}
