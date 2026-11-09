# ReRider Rentals

A production-ready commercial and private two-wheeler (bike and scooter) rental operations management platform. Engineered initially for single-scooter fleet operations in Kochi (Ernakulam), Kerala, India (Honda Dio 110cc, `KL-00-AA-0000`), and architected for multi-vehicle scaling.

---

## Technical Stack

- **Framework**: Next.js 15.5+ (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom Swiggy-inspired design tokens
- **Database & ORM**: PostgreSQL 16+, Drizzle ORM
- **Authentication**: Signed JWT session cookies (`jose`), `bcryptjs`, RBAC
- **Validation**: Zod (Server Actions & Client Forms)
- **Testing**: Vitest with v8 coverage

---

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 3. Database Migrations & Seeding
```bash
# Generate SQL migrations
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Seed initial data (Honda Dio, rental packages, admin & rider accounts)
pnpm run db:seed
```

### 4. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & QA Commands

Run the full verification suite before committing any changes:

```bash
# 1. Execute all automated unit, workflow, and accessibility tests
pnpm test

# 2. Type checking (TypeScript Strict Mode)
pnpm exec tsc --noEmit

# 3. Code linting (ESLint 9 Flat Config)
pnpm run lint

# 4. Production build check
pnpm run build
```

---

## Key Business Invariants

- **Assignment Exclusivity**: A vehicle can only have 1 active assignment; a rider can only have 1 active rental.
- **Contract & Price Immutability**: Confirmed bookings freeze rates in `booking_price_snapshots`.
- **Deposit Liability Segregation**: Security deposits (₹4,000) are refundable balance sheet liabilities, NEVER rental revenue.
- **Kerala MVD Compliance Gate**: Vehicles in `PENDING_REVIEW` are `UNAVAILABLE` and cannot be assigned until verified compliant.
- **Vehicle Replacement**: Replaces breakdown scooters while preserving booking identity, rider identity, and original pricing.

## Rental Booking Flow

- Riders sign in with their database-backed account and request a compliant, available vehicle/package from `/rider/my-rental`.
- A request creates a `PENDING` booking and immutable price snapshot. Date conflicts are checked for both the rider and vehicle.
- An administrator reviews and confirms or declines the request in `/admin/bookings`; approval identity and time are recorded on the booking.
- Operations records the booking token, remaining rent, and refundable security deposit separately. The deposit stays in the liability ledger.
- Handover creates an assignment and inspection record. Return closes the assignment, records the return inspection, and updates vehicle status.
- An administrator settles the deposit with an explicit refund and any documented deductions. Riders can review receipts and deposit movements under `/rider/payments`.

The additive approval audit migration is `drizzle/migrations/0002_booking_review_audit.sql`.

---

## Project Directives & Workflow

See [`AGENTS.md`](./AGENTS.md) for full project architecture, coding standards, business invariants, and the 8-step development workflow.


## Deploying with Vercel Postgres

New Vercel projects use a PostgreSQL provider from the Vercel Marketplace (for example, Neon Postgres). Connect the provider to the Vercel project and add its pooled connection string as POSTGRES_URL or DATABASE_URL. Use POSTGRES_URL_NON_POOLING or DATABASE_URL for Drizzle migrations; the application and Drizzle config accept either variable. Add a separate random `AUTH_SECRET` of at least 32 characters to Development, Preview, and Production environments.

Apply migrations from a trusted development machine after setting the target database URL. Do not run the demo seed against production: it creates example fleet and rider records. For local development only, set unique `SEED_ADMIN_PASSWORD` and `SEED_RIDER_PASSWORD` values (12+ characters) before running `pnpm run db:seed`. The seed uses example.invalid accounts and placeholder vehicle identifiers.

Never commit .env.local or provider credentials.

