'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2, DollarSign, Clock, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface WeekData {
  week: number;
  hours: number;
}

interface Paycheck {
  id: string;
  weekNumber: number;
  year: number;
  paycheckDate: string;
  grossPay: number;
  netPay: number;
  hoursReceived: number;
  notes: string | null;
}

interface Props {
  weeklyDataByYear: Record<number, WeekData[]>;
  paychecks: Paycheck[];
  currentYear: number;
  availableYears: number[];
}

export default function PaychecksClient({ weeklyDataByYear, paychecks, currentYear, availableYears }: Props) {
  const router = useRouter();
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [form, setForm] = useState({
    paycheckDate: '',
    grossPay: '',
    netPay: '',
    hoursReceived: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(currentYear);

  const weeklyData = useMemo(() => weeklyDataByYear[year] ?? [], [weeklyDataByYear, year]);
  const yearPaychecks = useMemo(() => (paychecks ?? []).filter(p => p.year === year), [paychecks, year]);

  const paycheckMap = useMemo(() => {
    const m = new Map<number, Paycheck>();
    yearPaychecks.forEach((p) => m.set(p.weekNumber, p));
    return m;
  }, [yearPaychecks]);

  const totalWorkedHours = weeklyData.reduce((s, w) => s + w.hours, 0);
  const totalGross = yearPaychecks.reduce((s, p) => s + p.grossPay, 0);
  const totalNet = yearPaychecks.reduce((s, p) => s + p.netPay, 0);
  const totalPaycheckHours = yearPaychecks.reduce((s, p) => s + p.hoursReceived, 0);

  const openEdit = useCallback((week: number) => {
    const existing = paycheckMap.get(week);
    if (existing) {
      setForm({
        paycheckDate: existing.paycheckDate ? format(new Date(existing.paycheckDate), 'yyyy-MM-dd') : '',
        grossPay: String(existing.grossPay ?? ''),
        netPay: String(existing.netPay ?? ''),
        hoursReceived: String(existing.hoursReceived ?? ''),
        notes: existing.notes ?? '',
      });
    } else {
      setForm({ paycheckDate: '', grossPay: '', netPay: '', hoursReceived: '', notes: '' });
    }
    setEditingWeek(week);
  }, [paycheckMap]);

  const handleSave = async () => {
    if (!editingWeek || !form.paycheckDate) return;
    setSaving(true);
    try {
      await fetch('/api/paychecks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: editingWeek,
          year,
          paycheckDate: form.paycheckDate,
          grossPay: parseFloat(form.grossPay) || 0,
          netPay: parseFloat(form.netPay) || 0,
          hoursReceived: parseFloat(form.hoursReceived) || 0,
          notes: form.notes || null,
        }),
      });
      setEditingWeek(null);
      router.refresh();
    } catch (err) {
      console.error('Save paycheck error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this paycheck entry?')) return;
    try {
      await fetch(`/api/paychecks?id=${id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      console.error('Delete paycheck error:', err);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">Paycheck Tracker</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Compare worked hours with your paychecks</p>
        </div>
        {/* Year tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setYear(yr)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                yr === year
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-sky-100"><Clock className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" /></div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Worked Hours</p>
              <p className="text-base sm:text-xl font-bold">{totalWorkedHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-100"><DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" /></div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Gross</p>
              <p className="text-base sm:text-xl font-bold">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-violet-100"><DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" /></div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Net</p>
              <p className="text-base sm:text-xl font-bold">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-amber-100"><Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" /></div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Paycheck Hours</p>
              <p className="text-base sm:text-xl font-bold">{totalPaycheckHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Difference alert */}
      {totalWorkedHours > 0 && totalPaycheckHours > 0 && Math.abs(totalWorkedHours - totalPaycheckHours) > 0.5 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Difference: <strong>{Math.abs(totalWorkedHours - totalPaycheckHours).toFixed(1)} hours</strong>
            {totalWorkedHours > totalPaycheckHours ? ' (worked more than paid)' : ' (paid more than worked)'}
          </span>
        </div>
      )}

      {/* Paycheck Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Weekly Paycheck Breakdown {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 sm:px-3 font-semibold text-gray-600">Week</th>
                  <th className="text-right py-2 px-2 sm:px-3 font-semibold text-gray-600">Worked Hrs</th>
                  <th className="text-center py-2 px-2 sm:px-3 font-semibold text-gray-600 hidden sm:table-cell">Date</th>
                  <th className="text-right py-2 px-2 sm:px-3 font-semibold text-gray-600">Gross</th>
                  <th className="text-right py-2 px-2 sm:px-3 font-semibold text-gray-600">Net</th>
                  <th className="text-right py-2 px-2 sm:px-3 font-semibold text-gray-600 hidden sm:table-cell">PC Hrs</th>
                  <th className="text-right py-2 px-2 sm:px-3 font-semibold text-gray-600 hidden sm:table-cell">Diff</th>
                  <th className="text-center py-2 px-2 sm:px-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((w) => {
                  const pc = paycheckMap.get(w.week);
                  const diff = pc ? (w.hours - pc.hoursReceived) : null;
                  return (
                    <tr key={w.week} className={`border-b border-gray-100 hover:bg-gray-50 ${w.hours > 0 ? '' : 'text-gray-400'}`}>
                      <td className="py-1.5 px-2 sm:px-3 font-medium">W{w.week}</td>
                      <td className="py-1.5 px-2 sm:px-3 text-right font-medium">{w.hours > 0 ? w.hours.toFixed(1) : '\u2014'}</td>
                      <td className="py-1.5 px-2 sm:px-3 text-center hidden sm:table-cell">
                        {pc ? format(new Date(pc.paycheckDate), 'MM/dd/yyyy') : '\u2014'}
                      </td>
                      <td className="py-1.5 px-2 sm:px-3 text-right">
                        {pc ? `$${pc.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014'}
                      </td>
                      <td className="py-1.5 px-2 sm:px-3 text-right">
                        {pc ? `$${pc.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014'}
                      </td>
                      <td className="py-1.5 px-2 sm:px-3 text-right hidden sm:table-cell">
                        {pc ? pc.hoursReceived.toFixed(1) : '\u2014'}
                      </td>
                      <td className={`py-1.5 px-2 sm:px-3 text-right font-medium hidden sm:table-cell ${
                        diff === null ? 'text-gray-400' : diff > 0.5 ? 'text-red-600' : diff < -0.5 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {diff !== null ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : '\u2014'}
                      </td>
                      <td className="py-1.5 px-2 sm:px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(w.week)}
                            className="p-1 sm:p-1.5 rounded-md hover:bg-sky-100 text-sky-600 transition-colors"
                            title={pc ? 'Edit paycheck' : 'Add paycheck'}
                          >
                            {pc ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                          {pc && (
                            <button
                              onClick={() => handleDelete(pc.id)}
                              className="p-1 sm:p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
                              title="Delete paycheck"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingWeek !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#1e3a5f]">
                {paycheckMap.has(editingWeek) ? 'Edit' : 'Add'} Paycheck Week {editingWeek}
              </h3>
              <button onClick={() => setEditingWeek(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Worked hours this week: <strong>{weeklyData.find(w => w.week === editingWeek)?.hours.toFixed(1) ?? '0.0'}</strong>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paycheck Date *</label>
                <input
                  type="date"
                  value={form.paycheckDate}
                  onChange={(e) => setForm({ ...form, paycheckDate: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Pay ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.grossPay}
                    onChange={(e) => setForm({ ...form, grossPay: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Pay ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.netPay}
                    onChange={(e) => setForm({ ...form, netPay: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours (from paycheck)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.hoursReceived}
                  onChange={(e) => setForm({ ...form, hoursReceived: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingWeek(null)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.paycheckDate}
                className="bg-[#1e3a5f] hover:bg-[#15304f] text-white"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
