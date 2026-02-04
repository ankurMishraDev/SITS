import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Party, PartyInsert, PartyUpdate } from '../types';

const QUERY_KEY = 'parties';

export function useParties() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Party[];
    },
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Party;
    },
    enabled: !!id,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (party: PartyInsert) => {
      const { data, error } = await supabase
        .from('parties')
        .insert(party)
        .select()
        .single();
      
      if (error) throw error;
      return data as Party;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartyUpdate }) => {
      const { data: updated, error } = await supabase
        .from('parties')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Party;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
