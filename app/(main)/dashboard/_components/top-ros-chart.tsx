'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';

interface TopRo {
  roNumber: string;
  label: string;
  hours: number;
  earnings: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length > 0) {
    const item = payload[0]?.payload;
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 text-xs">
        <p className="font-semibold text-gray-300 mb-1">RO# {item?.roNumber}</p>
        <p className="text-purple-300">{item?.label}</p>
        <p className="text-cyan-400">Hours: <span className="font-bold">{Number(item?.hours ?? 0).toFixed(1)}</span></p>
        <p className="text-emerald-400">Earnings: <span className="font-bold">${Number(item?.earnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
      </div>
    );
  }
  return null;
}

export default function TopRosChart({ data }: { data: TopRo[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} layout="vertical" margin={{ top: 5, right: 70, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="rosGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 9, fill: '#334155' }} width={120} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }} />
        <Bar dataKey="earnings" fill="url(#rosGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="earnings"
            position="right"
            formatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
            style={{ fontSize: 12, fill: '#4c1d95', fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
