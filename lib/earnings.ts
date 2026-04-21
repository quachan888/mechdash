import { prisma } from './prisma';

type RateRange = {
  rate: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getHourlyRateFromRanges(date: Date, rates: RateRange[], fallback = 45): number {
  const dateKey = toDateKey(date);

  for (let i = rates.length - 1; i >= 0; i--) {
    const rate = rates[i];
    if (!rate) continue;

    const fromKey = toDateKey(rate.effectiveFrom);
    const toKey = rate.effectiveTo ? toDateKey(rate.effectiveTo) : null;

    if (dateKey >= fromKey && (!toKey || dateKey <= toKey)) {
      return rate.rate;
    }
  }

  return fallback;
}

export async function getHourlyRateForDate(date: Date, userId?: string | null): Promise<number> {
  const rates = await prisma.hourlyRate.findMany({
    where: { userId: userId ?? undefined },
    orderBy: { effectiveFrom: 'asc' },
  });

  return getHourlyRateFromRanges(date, rates);
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
