import { db } from './index';
import * as schema from './schema';
import { hashPassword } from '../auth/password';

export async function seedDatabase() {
  console.log('🌱 Starting ReRider Rentals Database Seed...');

  // 1. Roles
  console.log('-> Seeding roles...');
  const roleRecords = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full business and financial access' },
    { code: 'ADMIN', name: 'Operations Admin', description: 'Fleet, pricing, booking, and rider management' },
    { code: 'STAFF', name: 'Field Staff / Inspector', description: 'Inspections, handover, and maintenance logs' },
    { code: 'RIDER', name: 'Verified Rider', description: 'Customer portal access for scooter rentals' },
  ];

  for (const r of roleRecords) {
    await db
      .insert(schema.roles)
      .values(r)
      .onConflictDoNothing();
  }

  // 2. Users & Passwords
  console.log('-> Seeding default users...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const riderPassword = process.env.SEED_RIDER_PASSWORD
  if (!adminPassword || adminPassword.length < 12 || !riderPassword || riderPassword.length < 12) {
    throw new Error('Set unique SEED_ADMIN_PASSWORD and SEED_RIDER_PASSWORD values (at least 12 characters) before seeding.')
  }
  const adminPasswordHash = await hashPassword(adminPassword)
  const riderPasswordHash = await hashPassword(riderPassword)

  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: 'admin@example.invalid',
      phone: '+910000000000',
      passwordHash: adminPasswordHash,
      firstName: 'Operations',
      lastName: 'Manager',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  const [riderUser] = await db
    .insert(schema.users)
    .values({
      email: 'rider@example.invalid',
      phone: '+910000000001',
      passwordHash: riderPasswordHash,
      firstName: 'Demo',
      lastName: 'Rider',
      role: 'RIDER',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  // 3. Rider Profile
  if (riderUser) {
    console.log('-> Seeding verified rider profile...');
    await db
      .insert(schema.riderProfiles)
      .values({
        userId: riderUser.id,
        fullName: 'Demo Rider',
        dateOfBirth: '2001-08-20', // Age 25 (Satisfies >= 20 age gate)
        phone: '+910000000001',
        email: 'rider@example.invalid',
        addressLine1: 'Demo Address',
        addressLine2: null,
        city: 'Kochi',
        state: 'Kerala',
        pincode: '000000',
        emergencyContactName: 'Demo Emergency Contact',
        emergencyContactPhone: '+910000000002',
        emergencyContactRelation: 'Emergency contact',
        verificationStatus: 'VERIFIED',
        accountStatus: 'ACTIVE',
      })
      .onConflictDoNothing();
  }

  // 4. Initial Fleet Scooter: Honda Dio 110cc in Kochi
  console.log('-> Seeding initial fleet vehicle (Honda Dio, KL-00-AA-0000)...');
  const [initialScooter] = await db
    .insert(schema.vehicles)
    .values({
      registrationNumber: 'KL-00-AA-0000',
      manufacturer: 'Honda',
      model: 'Dio',
      variant: '110cc Deluxe',
      manufacturingYear: 2022,
      fuelType: 'PETROL',
      vehicleCategory: 'SCOOTER',
      chassisNumber: 'DEMO-CHASSIS-000001',
      engineNumber: 'DEMO-ENGINE-000001',
      purchaseDate: '2026-01-15',
      purchaseCost: '70000.00', // ₹70k vehicle purchase target
      currentOdometer: 14250,
      operationalStatus: 'AVAILABLE',
      complianceStatus: 'VERIFIED_COMPLIANT',
      complianceNotes: 'Kerala MVD Rent-a-Motorcycle Scheme compliance verified with commercial endorsement',
    })
    .onConflictDoNothing()
    .returning();

  // 5. Rental Packages: 14 Days and 26 Days
  console.log('-> Seeding rental packages (14d and 26d)...');
  const [pkg14] = await db
    .insert(schema.rentalPackages)
    .values({
      name: '14 Days Package',
      code: 'PKG_14D',
      durationDays: 14,
      description: 'Standard 2-week commercial rental package for gig delivery & commute',
      displayOrder: 1,
    })
    .onConflictDoNothing()
    .returning();

  const [pkg26] = await db
    .insert(schema.rentalPackages)
    .values({
      name: '26 Days Package',
      code: 'PKG_26D',
      durationDays: 26,
      description: 'Monthly commercial rental package with discounted daily rates',
      displayOrder: 2,
    })
    .onConflictDoNothing()
    .returning();

  // 6. Vehicle Pricing
  if (initialScooter && pkg14 && pkg26) {
    console.log('-> Seeding vehicle-specific pricing for Honda Dio...');
    await db
      .insert(schema.vehiclePricing)
      .values([
        {
          vehicleId: initialScooter.id,
          packageId: pkg14.id,
          dailyRate: '450.00',
          packageTotalRate: '6300.00', // 14 * 450
          bookingTokenAmount: '1000.00',
          securityDepositAmount: '4000.00',
          kmLimitPerDay: 100,
          extraKmCharge: '4.00',
          isActive: true,
        },
        {
          vehicleId: initialScooter.id,
          packageId: pkg26.id,
          dailyRate: '400.00',
          packageTotalRate: '10400.00', // 26 * 400
          bookingTokenAmount: '1000.00',
          securityDepositAmount: '4000.00',
          kmLimitPerDay: 100,
          extraKmCharge: '4.00',
          isActive: true,
        },
      ])
      .onConflictDoNothing();
  }

  // 7. Expense Categories
  console.log('-> Seeding expense categories...');
  const expenseCatRecords = [
    { code: 'PURCHASE', name: 'Vehicle Acquisition', isCapitalized: true },
    { code: 'REGISTRATION', name: 'MVD Registration & Commercial Transfer', isCapitalized: true },
    { code: 'INSURANCE', name: 'Commercial Passenger Insurance', isCapitalized: false },
    { code: 'SERVICING', name: 'Periodic Service & Oil Change', isCapitalized: false },
    { code: 'REPAIRS', name: 'Parts & Breakdown Repairs', isCapitalized: false },
    { code: 'CLEANING', name: 'Vehicle Water Wash & Detailing', isCapitalized: false },
  ];

  for (const c of expenseCatRecords) {
    await db
      .insert(schema.expenseCategories)
      .values(c)
      .onConflictDoNothing();
  }

  console.log('✅ ReRider Rentals Database Seed Completed Successfully!');
}

if (process.env.NODE_ENV !== 'test') {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}



