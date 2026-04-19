'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths } from 'date-fns';
import HoursChart from './hours-chart';
import TopMakesChart from './top-makes-chart';
import TopRosChart from './top-ros-chart';
import SummaryTables from './summary-tables';

interface RoRecord {
  id: string;
  roNumber: string;
  roCompletedDate: string;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleTrim: string | null;
  vehicleDescription: string | null;
  billedHours: number;
  laborSale: number;
  partsSale: number;
  subletSale: number;
  customerName: string | null;
  customerNumber: string | null;
  jobDescriptions: string | null;
  totalSale: number;
  createdAt: string;
  updatedAt: string;
}

interface HourlyRate {
  id: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

type QuickRange = '' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'ytd';
type ChartGranularity = 'day' | 'week' | 'month';

function getEarningsForRecord(record: RoRecord, rates: HourlyRate[]): number {
  const d = new Date(record?.roCompletedDate);
  for (let i = (rates?.length ?? 0) - 1; i >= 0; i--) {
    const r = rates?.[i];
    if (!r) continue;
    const from = new Date(r.effectiveFrom);
    const to = r.effectiveTo ? new Date(r.effectiveTo) : new Date('2099-12-31');
    if (d >= from && d <= to) return (record?.billedHours ?? 0) * (r?.rate ?? 0);
  }
  return (record?.billedHours ?? 0) * 45;
}

function getQuickRangeDates(range: QuickRange): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  switch (range) {
    case 'today':
      return { from: fmt(today), to: fmt(today) };
    case 'yesterday': {
      const y = subDays(today, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case 'this_week': {
      const ws = startOfWeek(today, { weekStartsOn: 1 });
      const we = endOfWeek(today, { weekStartsOn: 1 });
      return { from: fmt(ws), to: fmt(we) };
    }
    case 'last_week': {
      const lws = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lwe = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      return { from: fmt(lws), to: fmt(lwe) };
    }
    case 'this_month': {
      const ms = startOfMonth(today);
      return { from: fmt(ms), to: fmt(today) };
    }
    case 'last_month': {
      const lm = subMonths(today, 1);
      const lms = startOfMonth(lm);
      const lme = subDays(startOfMonth(today), 1);
      return { from: fmt(lms), to: fmt(lme) };
    }
    case 'ytd': {
      const ys = startOfYear(today);
      return { from: fmt(ys), to: fmt(today) };
    }
    default:
      return { from: '', to: '' };
  }
}

export default function DashboardClient({ records, rates }: { records: RoRecord[]; rates: HourlyRate[] }) {
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickRange, setQuickRange] = useState<QuickRange>('');

  const handleQuickRange = (val: QuickRange) => {
    setQuickRange(val);
    if (val === '') {
      setDateFrom('');
      setDateTo('');
    } else {
      const { from, to } = getQuickRangeDates(val);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleManualDate = (type: 'from' | 'to', val: string) => {
    setQuickRange('');
    if (type === 'from') setDateFrom(val);
    else setDateTo(val);
  };

  const filtered = useMemo(() => {
    return (records ?? []).filter((r: RoRecord) => {
      const d = new Date(r?.roCompletedDate);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);

  const totalHours = useMemo(() => filtered.reduce((s: number, r: RoRecord) => s + (r?.billedHours ?? 0), 0), [filtered]);
  const totalEarnings = useMemo(() => filtered.reduce((s: number, r: RoRecord) => s + getEarningsForRecord(r, rates ?? []), 0), [filtered, rates]);
  const totalROs = filtered?.length ?? 0;
  const avgEarningPerDay = useMemo(() => {
    const workingDays = new Set(
      (filtered ?? []).filter((r: RoRecord) => (r?.billedHours ?? 0) > 0).map((r: RoRecord) => r?.roCompletedDate?.slice?.(0, 10))
    );
    const dayCount = workingDays.size;
    return dayCount > 0 ? totalEarnings / dayCount : 0;
  }, [filtered, totalEarnings]);

  const timeGrouped = useMemo(() => {
    const groups: Record<string, { hours: number; earnings: number; count: number }> = {};
    (filtered ?? []).forEach((r: RoRecord) => {
      const d = parseISO(r?.roCompletedDate);
      let key = '';
      if (chartGranularity === 'day') key = format(d, 'yyyy-MM-dd');
      else if (chartGranularity === 'week') key = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      else key = format(startOfMonth(d), 'yyyy-MM');
      if (!groups[key]) groups[key] = { hours: 0, earnings: 0, count: 0 };
      const g = groups[key];
      if (g) {
        g.hours += r?.billedHours ?? 0;
        g.earnings += getEarningsForRecord(r, rates ?? []);
        g.count += 1;
      }
    });
    return Object.entries(groups ?? {})
      .map(([k, v]: [string, any]) => ({ period: k, hours: v?.hours ?? 0, earnings: v?.earnings ?? 0, count: v?.count ?? 0 }))
      .sort((a: any, b: any) => (a?.period ?? '').localeCompare(b?.period ?? ''));
  }, [filtered, chartGranularity, rates]);

  // Top 10 makes with count + total earnings
  const topMakes = useMemo(() => {
    const agg: Record<string, { count: number; earnings: number }> = {};
    (filtered ?? []).forEach((r: RoRecord) => {
      const m = r?.vehicleMake ?? 'Unknown';
      if (!agg[m]) agg[m] = { count: 0, earnings: 0 };
      agg[m]!.count += 1;
      agg[m]!.earnings += getEarningsForRecord(r, rates ?? []);
    });
    return Object.entries(agg)
      .map(([name, v]) => ({ name, count: v.count, earnings: Math.round(v.earnings) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered, rates]);

  // Top 10 biggest ROs: year make model, hours, earnings
  const topROs = useMemo(() => {
    return (filtered ?? [])
      .map((r: RoRecord) => {
        const yearStr = r.vehicleYear ? String(r.vehicleYear) : '';
        const label = [yearStr, r.vehicleMake ?? '', r.vehicleModel ?? ''].filter(Boolean).join(' ') || r.roNumber;
        return {
          roNumber: r.roNumber,
          label,
          hours: r.billedHours ?? 0,
          earnings: getEarningsForRecord(r, rates ?? []),
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10);
  }, [filtered, rates]);

  const granularityLabel: Record<string, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly' };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Track your repair orders, hours, and earnings</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={quickRange}
            onChange={(e) => handleQuickRange(e.target.value as QuickRange)}
            className="border rounded-md px-2 py-1.5 text-sm bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">Custom Range</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="ytd">Year to Date</option>
          </select>
          <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e: any) => handleManualDate('from', e?.target?.value ?? '')}
            className="border rounded-md px-2 py-1.5 text-sm bg-white"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e: any) => handleManualDate('to', e?.target?.value ?? '')}
            className="border rounded-md px-2 py-1.5 text-sm bg-white"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setQuickRange(''); }}
              className="text-xs text-red-500 hover:underline"
            >Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />} title="Total Hours" value={totalHours?.toFixed?.(1) ?? '0'} />
        <SummaryCard icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />} title="Total Earnings" value={`$${totalEarnings?.toLocaleString?.('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`} />
        <SummaryCard icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />} title="Total ROs" value={String(totalROs ?? 0)} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />} title="Avg Earning/Day" value={`$${avgEarningPerDay?.toLocaleString?.('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`} />
      </div>

      {/* Chart granularity tabs */}
      <Tabs value={chartGranularity} onValueChange={(v: string) => setChartGranularity(v as ChartGranularity)}>
        <TabsList>
          <TabsTrigger value="day">Daily</TabsTrigger>
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Hours + Earnings chart */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">
            Hours Worked & Earnings
            <span className="text-xs text-muted-foreground ml-2 font-normal">({granularityLabel[chartGranularity]} breakdown)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[360px]">
          {(timeGrouped?.length ?? 0) > 0 ? <HoursChart data={timeGrouped} /> : <EmptyChart />}
        </CardContent>
      </Card>

      {/* Top 10 Makes + Top 10 Biggest ROs side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base">Top 10 Makes</CardTitle></CardHeader>
          <CardContent className="h-[400px]">
            {(topMakes?.length ?? 0) > 0 ? <TopMakesChart data={topMakes} /> : <EmptyChart />}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base">Top 10 Biggest ROs</CardTitle></CardHeader>
          <CardContent className="h-[400px]">
            {(topROs?.length ?? 0) > 0 ? <TopRosChart data={topROs} /> : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* Summary Tables */}
      <SummaryTables records={records} rates={rates} />
    </div>
  );
}

function SummaryCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 rounded-xl bg-muted">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-base sm:text-xl font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available. Upload a CSV to get started.</div>;
}
