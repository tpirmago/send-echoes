import { useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ECHO_CONFIG } from '../utils/echoConfig';
import type { EchoType } from '../types/echo';

async function prepareFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.5,       // 500 KB
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file; // fallback to original if compression fails
  }
}

export interface CreateEchoInput {
  type: EchoType;
  title: string;
  content: string;
  unlockAt: Date;
  recipientEmail?: string;
  files?: File[];
}

export interface CreateEchoResult {
  echoId: string;
  failedFiles: string[]; // names of files that failed to upload
}

export function useCreateEcho() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEchoInput): Promise<CreateEchoResult> => {
      // 1. Insert the echo row
      const { data, error } = await supabase
        .from('echoes')
        .insert({
          user_id: user!.id,
          type: input.type,
          title: input.title.trim(),
          content: input.content.trim() || null,
          recipient_email: input.recipientEmail?.trim() || null,
          unlock_at: input.unlockAt.toISOString(),
          sphere_color: ECHO_CONFIG[input.type].color,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Upload attachments — collect errors instead of silently dropping
      const failedFiles: string[] = [];

      for (const file of input.files ?? []) {
        const prepared = await prepareFile(file);
        const ext = prepared.name.split('.').pop() ?? 'bin';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${user!.id}/${data.id}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('echo-attachments')
          .upload(path, prepared);

        if (uploadError) {
          console.error('[upload]', file.name, uploadError.message);
          failedFiles.push(file.name);
          continue;
        }

        const { error: insertError } = await supabase
          .from('echo_attachments')
          .insert({
            echo_id: data.id,
            file_path: path,
            file_name: file.name,        // original name
            file_size: prepared.size,    // actual stored size (after compression)
            mime_type: prepared.type,
          });

        if (insertError) {
          console.error('[insert attachment]', file.name, insertError.message);
          failedFiles.push(file.name);
        }
      }

      return { echoId: data.id, failedFiles };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echoes'] });
    },
  });
}
