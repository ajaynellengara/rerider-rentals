import React from 'react';
import { notFound } from 'next/navigation';
import { getVehicleById } from '@/services/vehicles';
import { VehicleEditForm } from '@/features/vehicles/components/vehicle-edit-form';

interface VehicleEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VehicleEditPageProps) {
  const { id } = await params;
  const data = await getVehicleById(id);
  if (!data) return { title: 'Vehicle Not Found | ReRider Rentals' };
  return {
    title: `Edit ${data.vehicle.registrationNumber} | ReRider Rentals`,
  };
}

export default async function VehicleEditPage({ params }: VehicleEditPageProps) {
  const { id } = await params;
  const data = await getVehicleById(id);

  if (!data) {
    notFound();
  }

  return <VehicleEditForm vehicle={data.vehicle} />;
}
