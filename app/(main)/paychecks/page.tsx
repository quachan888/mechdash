export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';
import PaychecksClient from './_components/paychecks-client';
import { getISOWeek } from 'date-fns';
import { redirect } from 'next/navigation';

export default async function PaychecksPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const currentYear = new Date().getFullYear();

  // Get all records for this user (all years)
  const records = await prisma.roRecord.findMany({
    where: { userId },
    select: { roCompletedDate: true, billedHours: true },
    orderBy: { roCompletedDate: 'asc' },
  });

  // Determine available years
  const yearsSet = new Set<number>();
  yearsSet.add(currentYear);
  records.forEach((r: any) => {
    const d = r.roCompletedDate instanceof Date ? r.roCompletedDate : new Date(r.roCompletedDate);
    yearsSet.add(d.getFullYear());
  });
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Build weekly hours per year
  const weeklyHoursByYear: Record<number, Record<number, number>> = {};
  records.forEach((r: any) => {
    const d = r.roCompletedDate instanceof Date ? r.roCompletedDate : new Date(r.roCompletedDate);
    const yr = d.getFullYear();
    const wk = getISOWeek(d);
    if (!weeklyHoursByYear[yr]) weeklyHoursByYear[yr] = {};
    weeklyHoursByYear[yr]![wk] = (weeklyHoursByYear[yr]![wk] ?? 0) + (r.billedHours ?? 0);
  });

  // Build full weekly data for each year
  const weeklyDataByYear: Record<number, { week: number; hours: number }[]> = {};
  availableYears.forEach((yr) => {
    const data = [];
    const hrs = weeklyHoursByYear[yr] ?? {};
    for (let i = 1; i <= 52; i++) {
      data.push({ week: i, hours: hrs[i] ?? 0 });
    }
    weeklyDataByYear[yr] = data;
  });

  // Get all paychecks for this user
  const paychecks = await prisma.paycheck.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { weekNumber: 'asc' }],
  });

  const serializedPaychecks = paychecks.map((p: any) => ({
    ...p,
    paycheckDate: p.paycheckDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <PaychecksClient
      weeklyDataByYear={weeklyDataByYear}
      paychecks={serializedPaychecks}
      currentYear={currentYear}
      availableYears={availableYears}
    />
  );
}
