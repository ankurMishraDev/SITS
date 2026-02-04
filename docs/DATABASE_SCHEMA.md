# SITS - Database Schema Documentation

## Overview
This document describes the PostgreSQL database schema for the SITS (Commission Business Tally) application.

---

## Tables

### 1. `parties` - Party Accounts (PA)
Stores information about party/client accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(255) | NO | - | Party name |
| `contact_no` | VARCHAR(20) | YES | - | Contact phone number |
| `pod_address` | TEXT | YES | - | POD delivery address |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

---

### 2. `suppliers` - Supplier Accounts (SA)
Stores information about supplier/transporter accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(255) | NO | - | Supplier name |
| `contact_no` | VARCHAR(20) | YES | - | Contact phone number |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

---

### 3. `vehicles`
Stores vehicle information linked to suppliers. One supplier can have multiple vehicles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `supplier_id` | UUID | NO | - | FK to `suppliers(id)` |
| `vehicle_no` | VARCHAR(20) | NO | - | Vehicle registration number |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

**Relationships:**
- `supplier_id` → `suppliers(id)` (ON DELETE CASCADE)

---

### 4. `charge_types`
Stores predefined and custom charge types for trips.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | - | Charge type name (UNIQUE) |
| `is_custom` | BOOLEAN | NO | `FALSE` | Whether this is a custom type |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |

**Predefined Charge Types (Seed Data):**
- Halting Charges
- Loading Charges
- Unloading Charges
- Shortage Claim
- Damage Claim

---

### 5. `trips` - Trip Records (T)
Main trip records linking parties, suppliers, and vehicles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `date` | DATE | NO | - | Trip date |
| `party_id` | UUID | NO | - | FK to `parties(id)` |
| `vehicle_id` | UUID | NO | - | FK to `vehicles(id)` |
| `origin` | VARCHAR(255) | NO | - | Origin place name |
| `destination` | VARCHAR(255) | NO | - | Destination place name |
| `freight_party` | DECIMAL(12,2) | NO | `0` | Freight amount for party (PA) |
| `freight_supplier` | DECIMAL(12,2) | NO | `0` | Freight amount for supplier (SA) |
| `lr_number` | VARCHAR(50) | YES | - | Loading Receipt number |
| `material_desc` | TEXT | YES | - | Material description |
| `notes` | TEXT | YES | - | Additional notes |
| `pod_uploaded` | BOOLEAN | NO | `FALSE` | Whether POD is uploaded |
| `status` | trip_status | NO | `'open'` | Trip status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

**Relationships:**
- `party_id` → `parties(id)` (ON DELETE RESTRICT)
- `vehicle_id` → `vehicles(id)` (ON DELETE RESTRICT)

---

### 6. `advances` - Advance Payments (Adv)
Stores advance payments for both party and supplier sides.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `trip_id` | UUID | NO | - | FK to `trips(id)` |
| `side` | transaction_side | NO | - | 'party' or 'supplier' |
| `amount` | DECIMAL(12,2) | NO | - | Advance amount |
| `received_date` | DATE | NO | - | Date payment received |
| `payment_mode` | payment_mode | NO | - | Payment method |
| `notes` | TEXT | YES | - | Optional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

**Relationships:**
- `trip_id` → `trips(id)` (ON DELETE CASCADE)

---

### 7. `charges`
Stores additional charges (add/deduct) that affect balance calculation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `trip_id` | UUID | NO | - | FK to `trips(id)` |
| `side` | transaction_side | NO | - | 'party' or 'supplier' |
| `charge_type_id` | UUID | NO | - | FK to `charge_types(id)` |
| `operation` | charge_operation | NO | - | 'add' or 'deduct' |
| `amount` | DECIMAL(12,2) | NO | - | Charge amount |
| `notes` | TEXT | YES | - | Optional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

**Relationships:**
- `trip_id` → `trips(id)` (ON DELETE CASCADE)
- `charge_type_id` → `charge_types(id)` (ON DELETE RESTRICT)

---

### 8. `balance_payments` - Balance Receipts (Bal)
Stores balance receipt payments for both party and supplier sides.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `trip_id` | UUID | NO | - | FK to `trips(id)` |
| `side` | transaction_side | NO | - | 'party' or 'supplier' |
| `amount` | DECIMAL(12,2) | NO | - | Payment amount |
| `received_date` | DATE | NO | - | Date payment received |
| `payment_mode` | payment_mode | NO | - | Payment method |
| `notes` | TEXT | YES | - | Optional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Last update timestamp |

**Relationships:**
- `trip_id` → `trips(id)` (ON DELETE CASCADE)

---

### 9. `pods` - Proof of Delivery
Stores uploaded POD images for trips.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `trip_id` | UUID | NO | - | FK to `trips(id)` |
| `image_url` | TEXT | NO | - | URL to stored image |
| `uploaded_at` | TIMESTAMP WITH TIME ZONE | NO | `NOW()` | Upload timestamp |

**Relationships:**
- `trip_id` → `trips(id)` (ON DELETE CASCADE)

---

## Enums

### `payment_mode`
Payment methods for advances and balance payments.
- `UPI`
- `Cash`
- `Bank`
- `Cheque`
- `Fuel`
- `Others`

### `transaction_side`
Indicates which side of the transaction (party or supplier).
- `party`
- `supplier`

### `charge_operation`
Type of charge operation affecting balance.
- `add` - Increases the total amount
- `deduct` - Decreases the total amount

### `trip_status`
Trip status tracking.
- `open` - Trip is active, awaiting completion
- `pod_received` - POD has been uploaded
- `settled` - All payments completed

---

## Views

### `trip_balances`
Calculated view showing balance summaries for each trip.

| Column | Type | Description |
|--------|------|-------------|
| `trip_id` | UUID | Trip ID |
| `freight_party` | DECIMAL | Party freight amount |
| `freight_supplier` | DECIMAL | Supplier freight amount |
| `party_advances_total` | DECIMAL | Total advances received from party |
| `party_charges_add` | DECIMAL | Total charges added for party |
| `party_charges_deduct` | DECIMAL | Total charges deducted for party |
| `party_balance_paid` | DECIMAL | Total balance paid by party |
| `party_balance_remaining` | DECIMAL | **Remaining balance from party** |
| `supplier_advances_total` | DECIMAL | Total advances paid to supplier |
| `supplier_charges_add` | DECIMAL | Total charges added for supplier |
| `supplier_charges_deduct` | DECIMAL | Total charges deducted for supplier |
| `supplier_balance_paid` | DECIMAL | Total balance paid to supplier |
| `supplier_balance_remaining` | DECIMAL | **Remaining balance to supplier** |

**Balance Calculation Formula:**
```
Remaining Balance = Freight + Charges(Add) - Charges(Deduct) - Advances - Balance Paid
```

---

## Indexes

| Index Name | Table | Columns |
|------------|-------|---------|
| `idx_vehicles_supplier_id` | vehicles | supplier_id |
| `idx_trips_party_id` | trips | party_id |
| `idx_trips_vehicle_id` | trips | vehicle_id |
| `idx_trips_date` | trips | date |
| `idx_trips_status` | trips | status |
| `idx_advances_trip_id` | advances | trip_id |
| `idx_advances_side` | advances | side |
| `idx_charges_trip_id` | charges | trip_id |
| `idx_charges_side` | charges | side |
| `idx_balance_payments_trip_id` | balance_payments | trip_id |
| `idx_balance_payments_side` | balance_payments | side |
| `idx_pods_trip_id` | pods | trip_id |

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│   parties   │       │  suppliers  │
│─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │
│ name        │       │ name        │
│ contact_no  │       │ contact_no  │
│ pod_address │       └──────┬──────┘
└──────┬──────┘              │
       │                     │ 1:N
       │                     ▼
       │              ┌─────────────┐
       │              │  vehicles   │
       │              │─────────────│
       │              │ id (PK)     │
       │              │ supplier_id │
       │              │ vehicle_no  │
       │              └──────┬──────┘
       │                     │
       │ 1:N                 │ 1:N
       ▼                     ▼
┌─────────────────────────────────────────────┐
│                    trips                     │
│─────────────────────────────────────────────│
│ id (PK)           │ freight_party           │
│ date              │ freight_supplier        │
│ party_id (FK)     │ lr_number              │
│ vehicle_id (FK)   │ material_desc          │
│ origin            │ notes                   │
│ destination       │ pod_uploaded           │
│                   │ status                  │
└────────────────────────┬────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         │ 1:N           │ 1:N           │ 1:N
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐
│  advances   │  │   charges   │  │ balance_payments │
│─────────────│  │─────────────│  │──────────────────│
│ id (PK)     │  │ id (PK)     │  │ id (PK)          │
│ trip_id     │  │ trip_id     │  │ trip_id          │
│ side        │  │ side        │  │ side             │
│ amount      │  │ charge_type │  │ amount           │
│ date        │  │ operation   │  │ date             │
│ payment_mode│  │ amount      │  │ payment_mode     │
│ notes       │  │ notes       │  │ notes            │
└─────────────┘  └──────┬──────┘  └──────────────────┘
                        │
                        │ N:1
                        ▼
                ┌─────────────┐
                │charge_types │
                │─────────────│
                │ id (PK)     │
                │ name        │
                │ is_custom   │
                └─────────────┘
```

---

## Business Rules

1. **Party must exist** before creating a trip
2. **Supplier must have at least one vehicle** to be selected for a trip
3. **POD must be uploaded** before adding balance payments for the supplier side
4. **Trip status** automatically updates to `pod_received` when POD is uploaded
5. **Charges can add or deduct** from the balance calculation
6. **Custom charge types** can be created by users on-the-fly
