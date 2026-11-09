import React from 'react';
import { getFleetVehicles } from '@/services/vehicles';
import { FleetListView } from '@/features/vehicles/components/fleet-list-view';

export const metadata = {
  title: 'Fleet Operations | ReRider Rentals',
  description: 'Manage commercial bike & scooter fleet, pricing, documents and operational status',
};

export default async function AdminVehiclesPage() {
  const vehicles = await getFleetVehicles();

  return <FleetListView initialVehicles={vehicles} />;
}
