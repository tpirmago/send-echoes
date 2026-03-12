import type { EchoType } from './echo';

// Raw row shapes returned by Supabase (snake_case)
export interface DbEchoAttachment {
  id: string;
  echo_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface DbEcho {
  id: string;
  user_id: string;
  type: EchoType;
  title: string;
  content: string | null;
  recipient_email: string | null;
  unlock_at: string; // ISO 8601 string
  is_unlocked: boolean;
  opened_at: string | null;
  is_public: boolean;
  sphere_color: string | null;
  created_at: string;
}

// Minimal Database generic used by the Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; created_at: string };
        Insert: { id: string; email?: string | null };
        Update: { email?: string | null };
      };
      echoes: {
        Row: DbEcho;
        Insert: Omit<DbEcho, 'id' | 'created_at' | 'is_unlocked' | 'is_public'> &
          Partial<Pick<DbEcho, 'id' | 'created_at' | 'is_unlocked' | 'is_public'>>;
        Update: Partial<DbEcho>;
      };
    };
  };
}
