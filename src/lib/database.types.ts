export type CommentStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      episode_comments: {
        Row: {
          id: string;
          episode_id: string;
          display_name: string;
          body: string;
          status: CommentStatus;
          created_at: string;
        };
        Insert: {
          episode_id: string;
          display_name: string;
          body: string;
          status?: CommentStatus;
        };
        Update: never;
        Relationships: [];
      };
      published_episodes: {
        Row: { id: string; published: boolean };
        Insert: { id: string; published?: boolean };
        Update: never;
        Relationships: [];
      };
      comment_rate_limits: {
        Row: { fingerprint_hash: string; next_allowed_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_episode_comment: {
        Args: {
          p_episode_id: string;
          p_display_name: string;
          p_body: string;
          p_fingerprint_hash: string;
        };
        Returns: { id: string; status: string; created_at: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
