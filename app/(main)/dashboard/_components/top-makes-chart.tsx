'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';

interface MakeData {
  name: string;
  count: number;
  earnings: number;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    const item = payload[0]?.payload;
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 text-xs">
        <p className="font-semibold text-gray-300 mb-1">{item?.name}</p>
        <p className="text-orange-300">ROs: <span className="font-bold">{item?.count}</span></p>
        <p className="text-emerald-400">Earnings: <span className="font-bold">${Number(item?.earnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
      </div>
    );
  }
  return null;
}

export default function TopMakesChart({ data }: { data: MakeData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} layout="vertical" margin={{ top: 5, right: 80, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="makesGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 10, fill: '#334155' }} width={80} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249, 115, 22, 0.08)' }} />
        <Bar dataKey="count" fill="url(#makesGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            content={(props: any) => {
              const { x, y, width, value, index } = props;
              const item = data?.[index];
              if (!item) return null;
              return (
                <text
                  x={(x ?? 0) + (width ?? 0) + 4}
                  y={(y ?? 0) + 4}
                  fill="#334155"
                  fontSize={12}
                  fontWeight={700}
                >
                  {value} | ${item.earnings.toLocaleString()}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
