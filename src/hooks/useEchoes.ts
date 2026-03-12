import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Echo } from '../types/echo';
import type { DbEcho } from '../types/database';

// Compute isUnlocked client-side from the unlock date.
// Phase 4 will also flip the DB column via an Edge Function.
function dbEchoToEcho(db: DbEcho): Echo {
  return {
    id: db.id,
    type: db.type,
    title: db.title,
    content: db.content ?? undefined,
    unlockAt: new Date(db.unlock_at),
    isUnlocked: new Date(db.unlock_at) <= new Date(),
    openedAt: db.opened_at ? new Date(db.opened_at) : undefined,
    createdAt: new Date(db.created_at),
    recipientEmail: db.recipient_email ?? undefined,
  };
}

export function useEchoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['echoes', user?.id],
    queryFn: async (): Promise<Echo[]> => {
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DbEcho[]).map(dbEchoToEcho);
    },
    enabled: !!user,
  });
}

export function useEcho(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['echo', id],
    queryFn: async (): Promise<Echo> => {
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return dbEchoToEcho(data as DbEcho);
    },
    enabled: !!user && !!id,
  });
}
