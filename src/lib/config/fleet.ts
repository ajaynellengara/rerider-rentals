/**
 * Static Fleet & Rental Package Configuration for ReRider Rentals (Kochi Hub)
 * Allows the Rider Portal to operate seamlessly without requiring a PostgreSQL database connection.
 */

export interface FleetPackage {
  id: string;
  name: string;
  code: string;
  durationDays: number;
  dailyRate: number;
  totalRentalPrice: number;
  bookingTokenAmount: number;
  securityDepositAmount: number;
  kmLimitPerDay: number;
  extraKmCharge: number;
}

export interface FleetVehicle {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  variant: string;
  registrationNumber: string;
  manufacturingYear: number;
  fuelType: string;
  vehicleCategory: string;
  currentOdometer: number;
  hubLocation: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  packages: FleetPackage[];
}

export const INITIAL_FLEET_VEHICLE: FleetVehicle = {
  id: 'honda-dio-110',
  name: 'Honda Dio 110cc',
  model: 'Dio',
  manufacturer: 'Honda',
  variant: 'Deluxe',
  registrationNumber: 'KL-07-BW-1234',
  manufacturingYear: 2022,
  fuelType: 'PETROL',
  vehicleCategory: 'SCOOTER',
  currentOdometer: 14200,
  hubLocation: 'Kochi (Ernakulam Central)',
  status: 'AVAILABLE',
  packages: [
    {
      id: 'pkg-14d',
      name: '14-Day Commercial Standard',
      code: 'PKG-14D',
      durationDays: 14,
      dailyRate: 450,
      totalRentalPrice: 6300,
      bookingTokenAmount: 1000,
      securityDepositAmount: 4000,
      kmLimitPerDay: 100,
      extraKmCharge: 4.0,
    },
    {
      id: 'pkg-26d',
      name: '26-Day Monthly Package',
      code: 'PKG-26D',
      durationDays: 26,
      dailyRate: 400,
      totalRentalPrice: 10400,
      bookingTokenAmount: 1000,
      securityDepositAmount: 4000,
      kmLimitPerDay: 100,
      extraKmCharge: 4.0,
    },
  ],
};

export const OWNER_SUPPORT_PHONE = process.env.RERIDER_SUPPORT_PHONE || '+919847000000';
export const OWNER_SUPPORT_WHATSAPP = process.env.RERIDER_SUPPORT_WHATSAPP || OWNER_SUPPORT_PHONE.replace(/[^0-9]/g, '');
