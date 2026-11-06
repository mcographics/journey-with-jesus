export type CommentStatus = "pending" | "approved" | "rejected";
export type VideoQuality = "720p" | "1080p" | "4K";
export type VideoContentType = "video/mp4" | "video/webm" | "video/quicktime";
export type SocialPlatform = "youtube" | "facebook" | "instagram" | "tiktok" | "x" | "linkedin" | "pinterest" | "twitch" | "discord" | "custom";

export type Database = {
  public: {
    Tables: {
      episode_comments: {
        Row: { id: string; episode_id: string; display_name: string; body: string; status: CommentStatus; created_at: string };
        Insert: { episode_id: string; display_name: string; body: string; status?: CommentStatus };
        Update: { status?: CommentStatus };
        Relationships: [];
      };
      published_episodes: { Row: { id: string; published: boolean }; Insert: { id: string; published?: boolean }; Update: never; Relationships: [] };
      comment_rate_limits: { Row: { fingerprint_hash: string; next_allowed_at: string }; Insert: never; Update: never; Relationships: [] };
      media_admins: { Row: { user_id: string; created_at: string }; Insert: { user_id: string; created_at?: string }; Update: never; Relationships: [] };
      media_characters: {
        Row: { id: string; name: string; role: string; summary: string; scripture_references: string; portrait_url: string | null; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: { id: string; name: string; role: string; summary: string; scripture_references?: string; portrait_url?: string | null; sort_order?: number; published?: boolean };
        Update: { name?: string; role?: string; summary?: string; scripture_references?: string; portrait_url?: string | null; sort_order?: number; published?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_team_members: {
        Row: { id: string; name: string; role: string; bio: string; profile_image_url: string | null; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: { id: string; name: string; role?: string; bio?: string; profile_image_url?: string | null; sort_order?: number; published?: boolean };
        Update: { name?: string; role?: string; bio?: string; profile_image_url?: string | null; sort_order?: number; published?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_social_links: {
        Row: { id: string; platform: SocialPlatform; label: string; url: string; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; platform: SocialPlatform; label: string; url: string; sort_order?: number; published?: boolean; created_at?: string; updated_at?: string };
        Update: { platform?: SocialPlatform; label?: string; url?: string; sort_order?: number; published?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_episodes: {
        Row: { id: string; title: string; description: string; scripture_reference: string | null; thumbnail_url: string | null; youtube_id: string | null; transcript_text: string | null; asl_interpretation_url: string | null; duration_seconds: number | null; episode_number: number; orientation: "landscape" | "portrait"; published: boolean; created_at: string; updated_at: string };
        Insert: { id: string; title: string; description?: string; scripture_reference?: string | null; thumbnail_url?: string | null; youtube_id?: string | null; transcript_text?: string | null; asl_interpretation_url?: string | null; duration_seconds?: number | null; episode_number?: number; orientation?: "landscape" | "portrait"; published?: boolean };
        Update: { title?: string; description?: string; scripture_reference?: string | null; thumbnail_url?: string | null; youtube_id?: string | null; transcript_text?: string | null; asl_interpretation_url?: string | null; duration_seconds?: number | null; episode_number?: number; orientation?: "landscape" | "portrait"; published?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_captions: {
        Row: { id: string; episode_id: string; language: string; label: string; kind: "captions" | "subtitles"; storage_path: string; is_default: boolean; created_at: string };
        Insert: { id?: string; episode_id: string; language: string; label: string; kind?: "captions" | "subtitles"; storage_path: string; is_default?: boolean };
        Update: { language?: string; label?: string; kind?: "captions" | "subtitles"; storage_path?: string; is_default?: boolean };
        Relationships: [];
      };
      media_video_sources: {
        Row: { id: string; episode_id: string; quality: VideoQuality; storage_path: string; content_type: VideoContentType; size_bytes: number; created_at: string };
        Insert: { id?: string; episode_id: string; quality: VideoQuality; storage_path: string; content_type: VideoContentType; size_bytes: number };
        Update: { storage_path?: string; content_type?: VideoContentType; size_bytes?: number };
        Relationships: [];
      };
      media_playlists: {
        Row: { id: string; title: string; description: string; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; description?: string; sort_order?: number; published?: boolean };
        Update: { title?: string; description?: string; sort_order?: number; published?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_playlist_items: {
        Row: { playlist_id: string; episode_id: string; sort_order: number };
        Insert: { playlist_id: string; episode_id: string; sort_order?: number };
        Update: { sort_order?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_episode_comment: { Args: { p_episode_id: string; p_display_name: string; p_body: string; p_fingerprint_hash: string }; Returns: { id: string; status: string; created_at: string }[] };
      is_media_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
