export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';
import DashboardClient from './_components/dashboard-client';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const records = await prisma.roRecord.findMany({
    where: { userId },
    orderBy: { roCompletedDate: 'asc' }
  });
  const rates = await prisma.hourlyRate.findMany({
    where: { userId },
    orderBy: { effectiveFrom: 'asc' }
  });

  const serialized = records.map((r: any) => ({
    ...r,
    roCompletedDate: r.roCompletedDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedRates = rates.map((r: any) => ({
    ...r,
    effectiveFrom: r.effectiveFrom.toISOString(),
    effectiveTo: r.effectiveTo?.toISOString?.() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <DashboardClient records={serialized} rates={serializedRates} />;
}
