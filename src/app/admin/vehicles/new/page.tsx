import React from 'react';
import { VehicleOnboardingForm } from '@/features/vehicles/components/vehicle-onboarding-form';

export const metadata = {
  title: 'Onboard Vehicle | ReRider Rentals',
  description: 'Add a new bike or scooter to the commercial rental fleet in Kochi',
};

export default function NewVehiclePage() {
  return <VehicleOnboardingForm />;
}
