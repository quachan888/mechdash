import { prisma } from './prisma';

export async function getHourlyRateForDate(date: Date, userId?: string | null): Promise<number> {
  const rate = await prisma.hourlyRate.findFirst({
    where: {
      userId: userId ?? undefined,
      effectiveFrom: { lte: date },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: date } },
      ],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  return rate?.rate ?? 45;
}

export async function calculateEarnings(
  hours: number,
  date: Date,
  userId?: string | null
): Promise<{ rate: number; earnings: number }> {
  const rate = await getHourlyRateForDate(date, userId);
  return {
    rate,
    earnings: hours * rate,
  };
}