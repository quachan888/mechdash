'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseISO, getISOWeek, getMonth, getYear } from 'date-fns';

interface RoRecord {
  roCompletedDate: string;
  billedHours: number;
}

interface HourlyRate {
  id: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

function getEarnings(hours: number, date: Date, rates: HourlyRate[]): number {
  for (let i = (rates?.length ?? 0) - 1; i >= 0; i--) {
    const r = rates?.[i];
    if (!r) continue;
    const from = new Date(r.effectiveFrom);
    const to = r.effectiveTo ? new Date(r.effectiveTo) : new Date('2099-12-31');
    if (date >= from && date <= to) return hours * (r?.rate ?? 0);
  }
  return hours * 45;
}

export default function SummaryTables({ records, rates }: { records: RoRecord[]; rates: HourlyRate[] }) {
  const currentYear = new Date().getFullYear();

  const currentYearRecords = useMemo(() => {
    return (records ?? []).filter((r) => {
      const y = getYear(parseISO(r.roCompletedDate));
      return y === currentYear;
    });
  }, [records, currentYear]);

  const weeklyData = useMemo(() => {
    const weeks: Record<number, { hours: number; earnings: number }> = {};
    currentYearRecords.forEach((r) => {
      const d = parseISO(r.roCompletedDate);
      const wk = getISOWeek(d);
      if (!weeks[wk]) weeks[wk] = { hours: 0, earnings: 0 };
      const hrs = r.billedHours ?? 0;
      weeks[wk]!.hours += hrs;
      weeks[wk]!.earnings += getEarnings(hrs, d, rates);
    });
    const result = [];
    for (let i = 1; i <= 52; i++) {
      result.push({ week: i, hours: weeks[i]?.hours ?? 0, earnings: weeks[i]?.earnings ?? 0 });
    }
    return result;
  }, [currentYearRecords, rates]);

  const monthlyData = useMemo(() => {
    const months: Record<number, { hours: number; earnings: number }> = {};
    currentYearRecords.forEach((r) => {
      const d = parseISO(r.roCompletedDate);
      const m = getMonth(d) + 1;
      if (!months[m]) months[m] = { hours: 0, earnings: 0 };
      const hrs = r.billedHours ?? 0;
      months[m]!.hours += hrs;
      months[m]!.earnings += getEarnings(hrs, d, rates);
    });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((name, idx) => ({
      month: idx + 1,
      name,
      hours: months[idx + 1]?.hours ?? 0,
      earnings: months[idx + 1]?.earnings ?? 0,
    }));
  }, [currentYearRecords, rates]);

  const yearlyData = useMemo(() => {
    const years: Record<number, { hours: number; earnings: number }> = {};
    (records ?? []).forEach((r) => {
      const d = parseISO(r.roCompletedDate);
      const y = getYear(d);
      if (!years[y]) years[y] = { hours: 0, earnings: 0 };
      const hrs = r.billedHours ?? 0;
      years[y]!.hours += hrs;
      years[y]!.earnings += getEarnings(hrs, d, rates);
    });
    return Object.entries(years)
      .map(([year, data]) => ({ year: Number(year), hours: data.hours, earnings: data.earnings }))
      .sort((a, b) => b.year - a.year);
  }, [records, rates]);

  const weeklyTotalHrs = weeklyData.reduce((s, w) => s + w.hours, 0);
  const weeklyTotalEarn = weeklyData.reduce((s, w) => s + w.earnings, 0);
  const monthlyTotalHrs = monthlyData.reduce((s, m) => s + m.hours, 0);
  const monthlyTotalEarn = monthlyData.reduce((s, m) => s + m.earnings, 0);

  const fmtMoney = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weekly Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Hours & Earnings — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Week</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600">Hours</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((w) => (
                  <tr key={w.week} className={`border-b border-gray-100 ${w.hours > 0 ? 'bg-sky-50/50' : ''}`}>
                    <td className="py-1.5 px-2 text-gray-700">Week {w.week}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-gray-900">{w.hours > 0 ? w.hours.toFixed(1) : '\u2014'}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-emerald-700">{w.earnings > 0 ? fmtMoney(w.earnings) : '\u2014'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-2 px-2 text-gray-800">Total</td>
                  <td className="py-2 px-2 text-right text-gray-900">{weeklyTotalHrs.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{fmtMoney(weeklyTotalEarn)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Hours & Earnings — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Month</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Hours</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} className={`border-b border-gray-100 ${m.hours > 0 ? 'bg-emerald-50/50' : ''}`}>
                  <td className="py-1.5 px-2 text-gray-700">{m.name}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-gray-900">{m.hours > 0 ? m.hours.toFixed(1) : '\u2014'}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-emerald-700">{m.earnings > 0 ? fmtMoney(m.earnings) : '\u2014'}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="py-2 px-2 text-gray-800">Total</td>
                <td className="py-2 px-2 text-right text-gray-900">{monthlyTotalHrs.toFixed(1)}</td>
                <td className="py-2 px-2 text-right text-emerald-700">{fmtMoney(monthlyTotalEarn)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Yearly Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Yearly Hours & Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Year</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Hours</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((y) => (
                <tr key={y.year} className="border-b border-gray-100 bg-violet-50/50">
                  <td className="py-1.5 px-2 text-gray-700">{y.year}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-gray-900">{y.hours.toFixed(1)}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-emerald-700">{fmtMoney(y.earnings)}</td>
                </tr>
              ))}
              {yearlyData.length > 0 && (
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-2 px-2 text-gray-800">Total</td>
                  <td className="py-2 px-2 text-right text-gray-900">{yearlyData.reduce((s, y) => s + y.hours, 0).toFixed(1)}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{fmtMoney(yearlyData.reduce((s, y) => s + y.earnings, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
