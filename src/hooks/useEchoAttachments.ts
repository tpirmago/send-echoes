import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DbEchoAttachment } from '../types/database';

export interface AttachmentWithUrl extends DbEchoAttachment {
  url: string | null; // null = signed URL failed
}

export function useEchoAttachments(echoId: string) {
  return useQuery({
    queryKey: ['echo-attachments', echoId],
    queryFn: async (): Promise<AttachmentWithUrl[]> => {
      const { data, error } = await supabase
        .from('echo_attachments')
        .select('*')
        .eq('echo_id', echoId)
        .order('created_at');

      if (error) throw error;
      if (!data?.length) return [];

      // Get signed URLs (valid 1 hour); keep the row even if URL generation fails
      const withUrls = await Promise.all(
        (data as DbEchoAttachment[]).map(async (row) => {
          const { data: signed, error: urlError } = await supabase.storage
            .from('echo-attachments')
            .createSignedUrl(row.file_path, 3600);

          if (urlError) {
            console.error('[signed url]', row.file_name, urlError.message);
          }

          return { ...row, url: signed?.signedUrl ?? null };
        })
      );

      return withUrls;
    },
    enabled: !!echoId,
    staleTime: 50 * 60 * 1000,
  });
}
