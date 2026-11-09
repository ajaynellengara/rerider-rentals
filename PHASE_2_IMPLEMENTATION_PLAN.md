# ReRider Rentals — Phase 2 Implementation Plan: Admin Fleet Management

> **Module:** Admin Fleet Management (`/admin/vehicles`)  
> **Target Fleet:** Starting with 1 Honda Dio 110cc (`KL-00-AA-0000`), architected for multi-vehicle expansion  
> **Status:** Draft Proposal for Review & Approval  
> **Design Language:** Swiggy-inspired mobile/desktop operations console (`#fc8019`, `#282c3f`, `#686b78`, `#e9e9eb`, `#ffffff`, `#f4f4f5`, `#f1f1f6`, 8px radius)

---

## 1. Objective & Scope

Phase 2 will implement the central **Fleet Management Module** within the Admin Dashboard, enabling the fleet owner to track physical scooters, manage vehicle-specific rental pricing, monitor compliance documents (RC, Insurance, PUC, Kerala MVD permits), record odometer readings, inspect status history, and monitor vehicle-level operating expenses.

All features will build directly upon the existing PostgreSQL schema (`src/lib/db/schema/`) and domain service architecture without introducing duplicate tables or hardcoded values.

---

## 2. Feature Inventory to Implement

```
/admin/vehicles
├── page.tsx                         # Fleet listing with horizontal filter lanes, search, and status badges
├── new/page.tsx                     # 3-step vehicle onboarding wizard (Specs, Compliance, Purchase)
└── [id]/
    ├── page.tsx                     # 360° Vehicle Command Center (7-tab unified interface)
    ├── edit/page.tsx                # Vehicle specification & odometer editor
    └── pricing/page.tsx             # Vehicle-specific package pricing matrix
```

### Detailed Features:
1. **Fleet Listing (`/admin/vehicles`):**
   - **Horizontal Category Lanes** (`overflow-x: auto`, hidden scrollbars):
     - `All Vehicles`, `Available`, `Rented`, `Maintenance`, `Accident`, `Reserved`, `Retired`.
   - **Search & Filter:** Instant filter by registration number (`KL-00-AA-0000`), manufacturer, or model.
   - **Fleet Summary Pills:** Total Fleet, Available Count, Rented Count, In-Shop (Maintenance/Accident).
   - **Vehicle Card / Row Density:** Displays thumbnail, brand/model, registration badge, operational status pill, current odometer, and active rental pricing.
2. **Add Vehicle (`/admin/vehicles/new`):**
   - Clean, sectioned form with inline Zod validation:
     - *Basic Specs:* Registration number, manufacturer, model, variant, year, fuel type, category (`SCOOTER`).
     - *Asset Identification:* Chassis number (unique), Engine number (unique).
     - *Financials:* Purchase date, purchase cost (default ₹70,000 for Dio), starting odometer.
     - *Compliance:* Initial compliance status (`PENDING_REVIEW` / `VERIFIED_COMPLIANT`), Kerala MVD commercial permit flag.
3. **Edit Vehicle (`/admin/vehicles/[id]/edit`):**
   - Update odometer reading, modify variant/color, change operational status with mandatory reason logging.
4. **360° Vehicle Command Center (`/admin/vehicles/[id]`):**
   - **Tab 1: Overview & Specs:** Asset details, acquisition cost, current operational and compliance state.
   - **Tab 2: Vehicle-Specific Rental Pricing:** Configure rates for 14-day (confirmed ₹450/day), 26-day (configurable), token amount (confirmed ₹1,000), security deposit (confirmed ₹4,000), and km allowances.
   - **Tab 3: Compliance & Documents:** RC, Comprehensive Insurance, PUC, Road Tax, Kerala MVD Permit, with validity dates and visual expiry badges (warning if < 30 days).
   - **Tab 4: Active Rental & Current Rider:** If `RENTED`, displays current rider card, active booking reference, handover odometer, and days remaining.
   - **Tab 5: Status History Timeline:** Chronological timeline of operational transitions (`AVAILABLE` -> `RENTED` -> `MAINTENANCE`) logged from `vehicle_status_history`.
   - **Tab 6: Maintenance & Accident Logs:** Linked records from `maintenance_records` and `accident_incidents`.
   - **Tab 7: Vehicle Expense Ledger:** Allocated servicing, repairs, and acquisition costs from `expenses`.

---

## 3. Schema & Service Inspection

### 3.1 Existing Tables Utilized (Zero Duplication)
- `vehicles` ([`src/lib/db/schema/vehicles.ts`](file:///d:/REACT/_personal/rerider-rentals/src/lib/db/schema/vehicles.ts))
- `vehicle_documents`
- `vehicle_status_history`
- `vehicle_photos`
- `rental_packages` & `vehicle_pricing` ([`src/lib/db/schema/pricing.ts`](file:///d:/REACT/_personal/rerider-rentals/src/lib/db/schema/pricing.ts))
- `expenses` & `expense_categories` ([`src/lib/db/schema/financials.ts`](file:///d:/REACT/_personal/rerider-rentals/src/lib/db/schema/financials.ts))
- `vehicle_assignments` ([`src/lib/db/schema/assignments.ts`](file:///d:/REACT/_personal/rerider-rentals/src/lib/db/schema/assignments.ts))

### 3.2 Missing Elements Identified (To Be Added in Phase 2)
1. **Vehicle Repository / Data Layer (`src/services/vehicles.ts`):**
   - Query function `getFleetVehicles(filters)`: Returns vehicle list with operational status and active pricing.
   - Query function `getVehicleById(id)`: Returns full 360° aggregate data (specs, documents, pricing, assignment, history, expenses).
   - Mutation function `createVehicle(data)`: Validates registration uniqueness, writes `vehicles`, logs initial status to `vehicle_status_history`.
   - Mutation function `updateVehicleStatus(id, newStatus, reason, adminId)`: Updates status and inserts history record within a transaction.
2. **Server Actions (`src/features/vehicles/actions.ts`):**
   - `createVehicleAction(formData)` with Zod validation.
   - `updateVehicleAction(id, formData)`.
   - `upsertVehiclePricingAction(vehicleId, packageId, pricingData)`.
   - `uploadVehicleDocumentAction(vehicleId, docData)`.
3. **Zod Validation Schemas (`src/lib/validations/vehicle.ts`):**
   - `vehicleCreateSchema`: Strict validation for registration format (`KL-\d{2}-[A-Z]{1,3}-\d{4}`), positive costs, and non-empty engine/chassis.
   - `vehiclePricingSchema`: Validates positive daily rate, deposit >= 0, token <= total rent.

---

## 4. Protected Business Rules & Unfinalized Assumptions Handling

### Confirmed Rules Enforced:
- **Vehicle-specific pricing independence:** Vehicle A's pricing never mutates Vehicle B's rates or existing confirmed bookings.
- **Initial Fleet Target:** 1 second-hand petrol scooter (Honda Dio 110cc, investment target ₹80,000: ₹70,000 vehicle + ₹10,000 initial expenses).
- **14-day package rate:** ₹450/day (total ₹6,300), ₹1,000 token, ₹4,000 deposit.
- **Status Assignment Guard:** Vehicles in `MAINTENANCE` or `ACCIDENT` cannot be assigned.

### Unapproved Parameters Kept Fully Configurable:
- **26-day package daily rate:** Configurable in the vehicle pricing form (no hardcoded constants).
- **Daily km allowance:** Configurable per package/vehicle (default field populated from database setting, not hardcoded).
- **Extra km charge rate:** Configurable per vehicle (editable field).
- **Owner cancellation terms & damage deductions:** Documented as policy-driven configurable fields.

---

## 5. UI/UX Design System Compliance

All screens will conform strictly to the Swiggy-inspired design tokens:
- **Primary Action (Brand Orange):** `#fc8019` with **Charcoal text (`#282c3f`)** to guarantee WCAG AA contrast (5.47:1).
- **Headings & Primary Text:** Charcoal `#282c3f`, 700 weight, -0.02em letter spacing.
- **Body & Secondary Copy:** Muted Slate `#686b78`, 14px, 1.4 line height.
- **Dividers & Outlines:** `#e9e9eb`, 1px borders.
- **Card Surfaces:** Crisp white `#ffffff` with 8px border radius (`rounded-[8px]`).
- **Pills & Status Badges:** 9999px border radius (`rounded-full`) with light grey `#f1f1f6` or semantic status backgrounds (`available`, `rented`, `maintenance`, `accident`).
- **Responsive Viewports:** Tested at 360px, 390px, 768px, and 1440px desktop with zero horizontal overflow.

---

## 6. Implementation Stages & Review Gate

1. **Step 1:** Create Zod schemas in `src/lib/validations/vehicle.ts`.
2. **Step 2:** Create typed vehicle service methods in `src/services/vehicles.ts`.
3. **Step 3:** Implement Server Actions in `src/features/vehicles/actions.ts`.
4. **Step 4:** Build the Vehicle Listing view (`src/app/admin/vehicles/page.tsx`) with Swiggy filter lanes.
5. **Step 5:** Build the Add Vehicle wizard (`src/app/admin/vehicles/new/page.tsx`).
6. **Step 6:** Build the 360° Vehicle Command Center (`src/app/admin/vehicles/[id]/page.tsx`) with all 7 tabs.
7. **Step 7:** Write unit and component tests for vehicle CRUD and validation in `src/tests/vehicles.test.ts`.
8. **Step 8:** Run `pnpm test`, `tsc --noEmit`, `pnpm run lint`, and `pnpm run build` to verify zero errors.

---

### Approval Gate
Please review this implementation plan. Upon your approval, we will proceed immediately with **Step 1 through Step 8**.

