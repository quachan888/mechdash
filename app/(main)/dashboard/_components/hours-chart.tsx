'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';

interface DataPoint {
  period: string;
  hours: number;
  earnings: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length > 0) {
    const hours = payload[0]?.value ?? 0;
    const earnings = payload[0]?.payload?.earnings ?? 0;
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 text-xs">
        <p className="font-semibold text-gray-300 mb-1">{label}</p>
        <p className="text-cyan-400">Hours: <span className="font-bold">{Number(hours).toFixed(1)}</span></p>
        <p className="text-emerald-400">Earnings: <span className="font-bold">${Number(earnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
      </div>
    );
  }
  return null;
}

export default function HoursChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} margin={{ top: 24, right: 10, left: 0, bottom: 40 }}>
        <defs>
          <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0369a1" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={{ stroke: '#cbd5e1' }}
          tick={{ fontSize: 10, fill: '#64748b' }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: '#cbd5e1' }}
          tick={{ fontSize: 10, fill: '#64748b' }}
          label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11, fill: '#475569' } }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }} />
        <Bar dataKey="hours" fill="url(#hoursGradient)" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="earnings"
            position="top"
            formatter={(v: number) => v > 0 ? `$${Math.round(v).toLocaleString()}` : ''}
            style={{ fontSize: 13, fill: '#059669', fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
