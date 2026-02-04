import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LoadingSlip {
  id: string;
  party_id: string;
  vehicle_no: string;
  origin_place: string;
  destination_place: string;
  trip_date: string;
  freight_amount: number;
  advance_amount: number;
  material_description: string;
  lr_no: string;
  notes: string;
  created_at: string;
  updated_at: string;
  party?: {
    id: string;
    name: string;
    contact_no: string;
  };
}

export function useLoadingSlips() {
  const [data, setData] = useState<LoadingSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLoadingSlips = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: slips, error: fetchError } = await supabase
        .from('loading_slips')
        .select(`
          *,
          party:parties(id, name, contact_no)
        `)
        .order('trip_date', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching loading slips:', fetchError);
        throw fetchError;
      }
      
      setData(slips || []);
      setError(null);
    } catch (err) {
      console.error('❌ Exception in fetchLoadingSlips:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoadingSlips();
  }, [fetchLoadingSlips]);

  return { data, loading, error, refetch: fetchLoadingSlips };
}

export function useLoadingSlip(id: string) {
  const [data, setData] = useState<LoadingSlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLoadingSlip = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data: slip, error: fetchError } = await supabase
        .from('loading_slips')
        .select(`
          *,
          party:parties(id, name, contact_no)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching loading slip:', fetchError);
        throw fetchError;
      }
      
      setData(slip);
      setError(null);
    } catch (err) {
      console.error('❌ Exception in fetchLoadingSlip:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoadingSlip();
  }, [fetchLoadingSlip]);

  return { data, loading, error, refetch: fetchLoadingSlip };
}

export function useCreateLoadingSlip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLoadingSlip = async (slip: Omit<LoadingSlip, 'id' | 'created_at' | 'updated_at' | 'party'>) => {
    try {
      setLoading(true);
      console.log('📝 Creating loading slip:', slip);
      
      const { data, error: createError } = await supabase
        .from('loading_slips')
        .insert([slip])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating loading slip:', createError);
        throw createError;
      }
      
      console.log('✅ Loading slip created:', data);
      setError(null);
      return data;
    } catch (err) {
      console.error('❌ Exception in createLoadingSlip:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createLoadingSlip, loading, error };
}

export function useUpdateLoadingSlip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateLoadingSlip = async (id: string, updates: Partial<LoadingSlip>) => {
    try {
      setLoading(true);
      const { data, error: updateError } = await supabase
        .from('loading_slips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setError(null);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateLoadingSlip, loading, error };
}

export function useDeleteLoadingSlip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteLoadingSlip = async (id: string) => {
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('loading_slips')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteLoadingSlip, loading, error };
}
