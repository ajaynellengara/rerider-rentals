import React from 'react';
import { notFound } from 'next/navigation';
import { getVehicleById } from '@/services/vehicles';
import { VehicleCommandCenter } from '@/features/vehicles/components/vehicle-command-center';

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VehiclePageProps) {
  const { id } = await params;
  const data = await getVehicleById(id);
  if (!data) return { title: 'Vehicle Not Found | ReRider Rentals' };
  return {
    title: `${data.vehicle.manufacturer} ${data.vehicle.model} (${data.vehicle.registrationNumber}) | ReRider Rentals`,
    description: `360° Vehicle Command Center for ${data.vehicle.registrationNumber}`,
  };
}

export default async function VehicleDetailsPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const data = await getVehicleById(id);

  if (!data) {
    notFound();
  }

  return <VehicleCommandCenter data={data} />;
}
