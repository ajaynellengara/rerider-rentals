-- ReRider Rentals: Critical Database Constraints & Immutability Triggers

-- 1. Exclusivity Invariant: No overlapping ACTIVE assignment for the same physical vehicle
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_vehicle_assignment 
ON vehicle_assignments (vehicle_id) 
WHERE (status = 'ACTIVE');

-- 2. Exclusivity Invariant: No simultaneous ACTIVE rental for the same rider
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_rider_assignment 
ON vehicle_assignments (rider_id) 
WHERE (status = 'ACTIVE');

-- 3. Invariant: Unique non-null payment references (e.g. UPI UTR)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_reference 
ON payments (transaction_reference) 
WHERE (transaction_reference IS NOT NULL);

-- 4. Invariant: Unique active pricing per vehicle and rental package
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_vehicle_package_pricing
ON vehicle_pricing (vehicle_id, package_id)
WHERE (is_active = true);

-- 5. Age Invariant: Enforce minimum 20 years age for verified riders
ALTER TABLE rider_profiles 
DROP CONSTRAINT IF EXISTS check_rider_age;

ALTER TABLE rider_profiles 
ADD CONSTRAINT check_rider_age 
CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '20 years');

-- 6. Immutability Trigger: Prohibit updates or deletions on successful payments
CREATE OR REPLACE FUNCTION enforce_payment_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status = 'SUCCESS' AND (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Financial Integrity Violation: Successful payments cannot be modified or deleted. Create a refund or adjustment transaction.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_payment_immutability ON payments;
CREATE TRIGGER trg_protect_payment_immutability
BEFORE UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION enforce_payment_immutability();

-- 7. Immutability Trigger: Prohibit modifications to frozen booking price snapshots
CREATE OR REPLACE FUNCTION enforce_snapshot_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'Contract Violation: Confirmed booking price snapshots are strictly frozen and immutable.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_price_snapshot ON booking_price_snapshots;
CREATE TRIGGER trg_protect_price_snapshot
BEFORE UPDATE OR DELETE ON booking_price_snapshots
FOR EACH ROW EXECUTE FUNCTION enforce_snapshot_immutability();
