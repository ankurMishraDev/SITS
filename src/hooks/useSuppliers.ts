import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Supplier, SupplierInsert, SupplierUpdate, Vehicle, VehicleInsert, VehicleUpdate, VehicleWithSupplier } from '../types';

const SUPPLIERS_KEY = 'suppliers';
const VEHICLES_KEY = 'vehicles';

// Supplier hooks
export function useSuppliers() {
  return useQuery({
    queryKey: [SUPPLIERS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: [SUPPLIERS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierUpdate }) => {
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Supplier;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY, id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
    },
  });
}

// Vehicle hooks
export function useVehicles(supplierId?: string) {
  return useQuery({
    queryKey: [VEHICLES_KEY, supplierId],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('*, supplier:suppliers(*)');
      
      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }
      
      const { data, error } = await query.order('vehicle_no');
      
      if (error) throw error;
      return data as VehicleWithSupplier[];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();
      
      if (error) throw error;
      return data as Vehicle;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY, vars.supplier_id] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleUpdate }) => {
      const { data: updated, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] });
    },
  });
}
