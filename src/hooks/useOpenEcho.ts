import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useOpenEcho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echoId: string) => {
      const { error } = await supabase
        .from('echoes')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', echoId)
        .is('opened_at', null); // only set once
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echoes'] });
    },
  });
}
