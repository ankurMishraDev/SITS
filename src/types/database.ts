// Database types generated from PostgreSQL schema
// These types match the Supabase schema

export type PaymentMode = 'UPI' | 'Cash' | 'Bank' | 'Cheque' | 'Fuel' | 'Others';
export type TransactionSide = 'party' | 'supplier';
export type ChargeOperation = 'add' | 'deduct';
export type TripStatus = 'open' | 'pod_received' | 'settled';

// Table Types
export interface Party {
  id: string;
  name: string;
  contact_no: string | null;
  pod_address: string | null;
  drive_folder_id: string | null; // Google Drive folder ID for this party
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  supplier_id: string;
  vehicle_no: string;
  created_at: string;
  updated_at: string;
}

export interface ChargeType {
  id: string;
  name: string;
  is_custom: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  date: string;
  party_id: string;
  vehicle_id: string;
  origin: string;
  destination: string;
  freight_party: number;
  freight_supplier: number;
  lr_number: string | null;
  material_desc: string | null;
  notes: string | null;
  pod_uploaded: boolean;
  drive_folder_id: string | null; // Google Drive folder ID for this trip's POD images
  drive_folder_name: string | null; // Folder name like "3485_31-Jan"
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface Advance {
  id: string;
  trip_id: string;
  side: TransactionSide;
  amount: number;
  received_date: string;
  payment_mode: PaymentMode;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Charge {
  id: string;
  trip_id: string;
  side: TransactionSide;
  charge_type_id: string;
  operation: ChargeOperation;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalancePayment {
  id: string;
  trip_id: string;
  side: TransactionSide;
  amount: number;
  received_date: string;
  payment_mode: PaymentMode;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pod {
  id: string;
  trip_id: string;
  image_url: string; // Google Drive web view link
  drive_file_id: string; // Google Drive file ID
  file_name: string; // Original file name
  uploaded_at: string;
}

// Insert Types (for creating new records)
// Omit auto-generated and optional Drive fields
export type PartyInsert = Omit<Party, 'id' | 'created_at' | 'updated_at' | 'drive_folder_id'> & {
  drive_folder_id?: string | null;
};
export type PartyUpdate = Partial<PartyInsert>;

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<SupplierInsert>;

export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdate = Partial<VehicleInsert>;

export type ChargeTypeInsert = Omit<ChargeType, 'id' | 'created_at'>;

export type TripInsert = Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'pod_uploaded' | 'status' | 'drive_folder_id' | 'drive_folder_name'> & {
  drive_folder_id?: string | null;
  drive_folder_name?: string | null;
};
export type TripUpdate = Partial<Omit<Trip, 'id' | 'created_at' | 'updated_at'>>;

export type AdvanceInsert = Omit<Advance, 'id' | 'created_at' | 'updated_at'>;
export type AdvanceUpdate = Partial<AdvanceInsert>;

export type ChargeInsert = Omit<Charge, 'id' | 'created_at' | 'updated_at'>;
export type ChargeUpdate = Partial<ChargeInsert>;

export type BalancePaymentInsert = Omit<BalancePayment, 'id' | 'created_at' | 'updated_at'>;
export type BalancePaymentUpdate = Partial<BalancePaymentInsert>;

export type PodInsert = Omit<Pod, 'id' | 'uploaded_at'>;

// Extended types with relations
export interface VehicleWithSupplier extends Vehicle {
  supplier: Supplier;
}

export interface TripWithRelations extends Trip {
  party: Party;
  vehicle: VehicleWithSupplier;
}

export interface TripBalances {
  trip_id: string;
  freight_party: number;
  freight_supplier: number;
  party_advances_total: number;
  party_charges_add: number;
  party_charges_deduct: number;
  party_balance_paid: number;
  party_balance_remaining: number;
  supplier_advances_total: number;
  supplier_charges_add: number;
  supplier_charges_deduct: number;
  supplier_balance_paid: number;
  supplier_balance_remaining: number;
}

// Supabase Database type for client
export interface Database {
  public: {
    Tables: {
      parties: {
        Row: Party;
        Insert: PartyInsert;
        Update: PartyUpdate;
        Relationships: [];
      };
      suppliers: {
        Row: Supplier;
        Insert: SupplierInsert;
        Update: SupplierUpdate;
        Relationships: [];
      };
      vehicles: {
        Row: Vehicle;
        Insert: VehicleInsert;
        Update: VehicleUpdate;
        Relationships: [
          {
            foreignKeyName: 'vehicles_supplier_id_fkey';
            columns: ['supplier_id'];
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          }
        ];
      };
      charge_types: {
        Row: ChargeType;
        Insert: ChargeTypeInsert;
        Update: Partial<ChargeTypeInsert>;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
        Relationships: [
          {
            foreignKeyName: 'trips_party_id_fkey';
            columns: ['party_id'];
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_vehicle_id_fkey';
            columns: ['vehicle_id'];
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          }
        ];
      };
      advances: {
        Row: Advance;
        Insert: AdvanceInsert;
        Update: AdvanceUpdate;
        Relationships: [
          {
            foreignKeyName: 'advances_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      charges: {
        Row: Charge;
        Insert: ChargeInsert;
        Update: ChargeUpdate;
        Relationships: [
          {
            foreignKeyName: 'charges_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_charge_type_id_fkey';
            columns: ['charge_type_id'];
            referencedRelation: 'charge_types';
            referencedColumns: ['id'];
          }
        ];
      };
      balance_payments: {
        Row: BalancePayment;
        Insert: BalancePaymentInsert;
        Update: BalancePaymentUpdate;
        Relationships: [
          {
            foreignKeyName: 'balance_payments_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      pods: {
        Row: Pod;
        Insert: PodInsert;
        Update: Partial<PodInsert>;
        Relationships: [
          {
            foreignKeyName: 'pods_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      trip_balances: {
        Row: TripBalances;
        Relationships: [];
      };
    };
    Enums: {
      payment_mode: PaymentMode;
      transaction_side: TransactionSide;
      charge_operation: ChargeOperation;
      trip_status: TripStatus;
    };
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
