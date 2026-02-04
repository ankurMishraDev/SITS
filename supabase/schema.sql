-- =============================================
-- SITS - Commission Business Tally App Schema
-- =============================================

-- ENUMS
-- =============================================

-- Payment modes for advances and balance payments
DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('UPI', 'Cash', 'Bank', 'Cheque', 'Fuel', 'Others');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Side indicator for advances, charges, and balance payments
DO $$ BEGIN
    CREATE TYPE transaction_side AS ENUM ('party', 'supplier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Charge operation type
DO $$ BEGIN
    CREATE TYPE charge_operation AS ENUM ('add', 'deduct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trip status tracking
DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('open', 'pod_received', 'settled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TABLES
-- =============================================

-- Party Accounts (PA)
-- Stores party/client information
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_no VARCHAR(20),
    pod_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Accounts (SA)
-- Stores supplier/transporter information
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_no VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles
-- Vehicles owned by suppliers (one supplier can have multiple vehicles)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    vehicle_no VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charge Types
-- Predefined and custom charge types for trips
CREATE TABLE charge_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips (T)
-- Main trip records linking parties, suppliers, and vehicles
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    freight_party DECIMAL(12, 2) NOT NULL DEFAULT 0,
    freight_supplier DECIMAL(12, 2) NOT NULL DEFAULT 0,
    lr_number VARCHAR(50),
    material_desc TEXT,
    notes TEXT,
    pod_uploaded BOOLEAN DEFAULT FALSE,
    status trip_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advances (Adv)
-- Advance payments for both party and supplier sides
CREATE TABLE advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    side transaction_side NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    received_date DATE NOT NULL,
    payment_mode payment_mode NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charges
-- Additional charges (add/deduct) affecting balance calculation
CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    side transaction_side NOT NULL,
    charge_type_id UUID NOT NULL REFERENCES charge_types(id) ON DELETE RESTRICT,
    operation charge_operation NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Balance Payments (Bal)
-- Balance receipt payments for both party and supplier sides
CREATE TABLE balance_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    side transaction_side NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    received_date DATE NOT NULL,
    payment_mode payment_mode NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PODs (Proof of Delivery)
-- Stores uploaded POD images for trips
CREATE TABLE pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
-- =============================================

CREATE INDEX idx_vehicles_supplier_id ON vehicles(supplier_id);
CREATE INDEX idx_trips_party_id ON trips(party_id);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_date ON trips(date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_advances_trip_id ON advances(trip_id);
CREATE INDEX idx_advances_side ON advances(side);
CREATE INDEX idx_charges_trip_id ON charges(trip_id);
CREATE INDEX idx_charges_side ON charges(side);
CREATE INDEX idx_balance_payments_trip_id ON balance_payments(trip_id);
CREATE INDEX idx_balance_payments_side ON balance_payments(side);
CREATE INDEX idx_pods_trip_id ON pods(trip_id);

-- SEED DATA
-- =============================================

-- Insert predefined charge types
INSERT INTO charge_types (name, is_custom) VALUES
    ('Halting Charges', FALSE),
    ('Loading Charges', FALSE),
    ('Unloading Charges', FALSE),
    ('Shortage Claim', FALSE),
    ('Damage Claim', FALSE);

-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS
-- =============================================

CREATE TRIGGER update_parties_updated_at
    BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advances_updated_at
    BEFORE UPDATE ON advances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charges_updated_at
    BEFORE UPDATE ON charges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_payments_updated_at
    BEFORE UPDATE ON balance_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VIEWS
-- =============================================

-- View to get trip with calculated balances
CREATE OR REPLACE VIEW trip_balances AS
SELECT 
    t.id as trip_id,
    t.freight_party,
    t.freight_supplier,
    
    -- Party side calculations
    COALESCE(pa.total_advances, 0) as party_advances_total,
    COALESCE(pc_add.total_charges, 0) as party_charges_add,
    COALESCE(pc_deduct.total_charges, 0) as party_charges_deduct,
    COALESCE(pb.total_balance, 0) as party_balance_paid,
    (t.freight_party + COALESCE(pc_add.total_charges, 0) - COALESCE(pc_deduct.total_charges, 0) 
     - COALESCE(pa.total_advances, 0) - COALESCE(pb.total_balance, 0)) as party_balance_remaining,
    
    -- Supplier side calculations
    COALESCE(sa.total_advances, 0) as supplier_advances_total,
    COALESCE(sc_add.total_charges, 0) as supplier_charges_add,
    COALESCE(sc_deduct.total_charges, 0) as supplier_charges_deduct,
    COALESCE(sb.total_balance, 0) as supplier_balance_paid,
    (t.freight_supplier + COALESCE(sc_add.total_charges, 0) - COALESCE(sc_deduct.total_charges, 0) 
     - COALESCE(sa.total_advances, 0) - COALESCE(sb.total_balance, 0)) as supplier_balance_remaining

FROM trips t

-- Party advances
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_advances 
    FROM advances WHERE side = 'party' GROUP BY trip_id
) pa ON t.id = pa.trip_id

-- Party charges (add)
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_charges 
    FROM charges WHERE side = 'party' AND operation = 'add' GROUP BY trip_id
) pc_add ON t.id = pc_add.trip_id

-- Party charges (deduct)
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_charges 
    FROM charges WHERE side = 'party' AND operation = 'deduct' GROUP BY trip_id
) pc_deduct ON t.id = pc_deduct.trip_id

-- Party balance payments
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_balance 
    FROM balance_payments WHERE side = 'party' GROUP BY trip_id
) pb ON t.id = pb.trip_id

-- Supplier advances
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_advances 
    FROM advances WHERE side = 'supplier' GROUP BY trip_id
) sa ON t.id = sa.trip_id

-- Supplier charges (add)
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_charges 
    FROM charges WHERE side = 'supplier' AND operation = 'add' GROUP BY trip_id
) sc_add ON t.id = sc_add.trip_id

-- Supplier charges (deduct)
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_charges 
    FROM charges WHERE side = 'supplier' AND operation = 'deduct' GROUP BY trip_id
) sc_deduct ON t.id = sc_deduct.trip_id

-- Supplier balance payments
LEFT JOIN (
    SELECT trip_id, SUM(amount) as total_balance 
    FROM balance_payments WHERE side = 'supplier' GROUP BY trip_id
) sb ON t.id = sb.trip_id;
