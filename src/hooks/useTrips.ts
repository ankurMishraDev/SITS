import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Trip, TripInsert, TripUpdate, TripWithRelations, TripBalances,
  Advance, AdvanceInsert, AdvanceUpdate,
  Charge, ChargeInsert, ChargeUpdate,
  BalancePayment, BalancePaymentInsert, BalancePaymentUpdate,
  ChargeType, ChargeTypeInsert,
  TransactionSide
} from '../types';

const TRIPS_KEY = 'trips';
const ADVANCES_KEY = 'advances';
const CHARGES_KEY = 'charges';
const BALANCE_PAYMENTS_KEY = 'balance_payments';
const CHARGE_TYPES_KEY = 'charge_types';

// Trip hooks
export function useTrips() {
  return useQuery({
    queryKey: [TRIPS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          party:parties(*),
          vehicle:vehicles(*, supplier:suppliers(*))
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as TripWithRelations[];
    },
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: [TRIPS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          party:parties(*),
          vehicle:vehicles(*, supplier:suppliers(*))
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as TripWithRelations;
    },
    enabled: !!id,
  });
}

export function useTripBalances(tripId: string) {
  return useQuery({
    queryKey: [TRIPS_KEY, tripId, 'balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_balances')
        .select('*')
        .eq('trip_id', tripId)
        .single();
      
      if (error) throw error;
      return data as TripBalances;
    },
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: TripInsert) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TripUpdate }) => {
      const { data: updated, error } = await supabase
        .from('trips')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Trip;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY] });
    },
  });
}

// Advance hooks
export function useAdvances(tripId: string, side?: TransactionSide) {
  return useQuery({
    queryKey: [ADVANCES_KEY, tripId, side],
    queryFn: async () => {
      let query = supabase
        .from('advances')
        .select('*')
        .eq('trip_id', tripId);
      
      if (side) {
        query = query.eq('side', side);
      }
      
      const { data, error } = await query.order('received_date', { ascending: false });
      
      if (error) throw error;
      return data as Advance[];
    },
    enabled: !!tripId,
  });
}

export function useCreateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (advance: AdvanceInsert) => {
      const { data, error } = await supabase
        .from('advances')
        .insert(advance)
        .select()
        .single();
      
      if (error) throw error;
      return data as Advance;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [ADVANCES_KEY, vars.trip_id] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, vars.trip_id, 'balances'] });
    },
  });
}

export function useUpdateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, tripId }: { id: string; data: AdvanceUpdate; tripId: string }) => {
      const { data: updated, error } = await supabase
        .from('advances')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Advance;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [ADVANCES_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

export function useDeleteAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase
        .from('advances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [ADVANCES_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

// Charge hooks
export function useCharges(tripId: string, side?: TransactionSide) {
  return useQuery({
    queryKey: [CHARGES_KEY, tripId, side],
    queryFn: async () => {
      let query = supabase
        .from('charges')
        .select('*, charge_type:charge_types(*)')
        .eq('trip_id', tripId);
      
      if (side) {
        query = query.eq('side', side);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useChargeTypes() {
  return useQuery({
    queryKey: [CHARGE_TYPES_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('charge_types')
        .select('*')
        .order('is_custom')
        .order('name');
      
      if (error) throw error;
      return data as ChargeType[];
    },
  });
}

export function useCreateChargeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chargeType: ChargeTypeInsert) => {
      const { data, error } = await supabase
        .from('charge_types')
        .insert(chargeType)
        .select()
        .single();
      
      if (error) throw error;
      return data as ChargeType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARGE_TYPES_KEY] });
    },
  });
}

export function useCreateCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (charge: ChargeInsert) => {
      const { data, error } = await supabase
        .from('charges')
        .insert(charge)
        .select()
        .single();
      
      if (error) throw error;
      return data as Charge;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [CHARGES_KEY, vars.trip_id] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, vars.trip_id, 'balances'] });
    },
  });
}

export function useUpdateCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, tripId }: { id: string; data: ChargeUpdate; tripId: string }) => {
      const { data: updated, error } = await supabase
        .from('charges')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Charge;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [CHARGES_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

export function useDeleteCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase
        .from('charges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [CHARGES_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

// Balance Payment hooks
export function useBalancePayments(tripId: string, side?: TransactionSide) {
  return useQuery({
    queryKey: [BALANCE_PAYMENTS_KEY, tripId, side],
    queryFn: async () => {
      let query = supabase
        .from('balance_payments')
        .select('*')
        .eq('trip_id', tripId);
      
      if (side) {
        query = query.eq('side', side);
      }
      
      const { data, error } = await query.order('received_date', { ascending: false });
      
      if (error) throw error;
      return data as BalancePayment[];
    },
    enabled: !!tripId,
  });
}

export function useCreateBalancePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: BalancePaymentInsert) => {
      const { data, error } = await supabase
        .from('balance_payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data as BalancePayment;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [BALANCE_PAYMENTS_KEY, vars.trip_id] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, vars.trip_id, 'balances'] });
    },
  });
}

export function useUpdateBalancePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, tripId }: { id: string; data: BalancePaymentUpdate; tripId: string }) => {
      const { data: updated, error } = await supabase
        .from('balance_payments')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as BalancePayment;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [BALANCE_PAYMENTS_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

export function useDeleteBalancePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase
        .from('balance_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [BALANCE_PAYMENTS_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId, 'balances'] });
    },
  });
}

// POD hooks
const PODS_KEY = 'pods';

export function usePods(tripId: string) {
  return useQuery({
    queryKey: [PODS_KEY, tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pods')
        .select('*')
        .eq('trip_id', tripId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useCreatePod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pod: { trip_id: string; image_url: string; drive_file_id: string; file_name: string }) => {
      const { data, error } = await supabase
        .from('pods')
        .insert(pod)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PODS_KEY, vars.trip_id] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, vars.trip_id] });
    },
  });
}

export function useDeletePod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase
        .from('pods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [PODS_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: [TRIPS_KEY, tripId] });
    },
  });
}
