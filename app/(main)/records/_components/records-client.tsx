'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface RoJobLine {
  id: string;
  lineNumber: number | null;
  jobDescription: string | null;
  billedHours: number;
  laborSale: number;
  partsSale: number;
  subletSale: number;
  totalSale: number;
  appliedRate: number;
  earnedAmount: number;
  roCompletedDate: string;
}

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
  totalSale: number;
  customerName: string | null;
  jobDescriptions: string | null;
  jobLines: RoJobLine[];
  earnedAmount: number;
}

function getRoEarned(record: RoRecord): number {
  if (typeof record.earnedAmount === 'number') {
    return record.earnedAmount;
  }

  return (record.jobLines ?? []).reduce(
    (sum, line) => sum + (line.earnedAmount ?? 0),
    0
  );
}

export default function RecordsClient() {
  const [records, setRecords] = useState<RoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<string>('roCompletedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RoRecord | null>(null);

  const perPage = 25;

  useEffect(() => {
    fetch('/api/records')
      .then((r: Response) => r?.json?.())
      .then((d: any) => setRecords(d?.records ?? []))
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoading(false));
  }, []);

  const makes = useMemo(() => {
    const s = new Set(
      (records ?? []).map((r: RoRecord) => r?.vehicleMake).filter(Boolean) as string[]
    );
    return Array.from(s).sort();
  }, [records]);

  const models = useMemo(() => {
    const s = new Set(
      (records ?? []).map((r: RoRecord) => r?.vehicleModel).filter(Boolean) as string[]
    );
    return Array.from(s).sort();
  }, [records]);

  const years = useMemo(() => {
    const s = new Set(
      (records ?? []).map((r: RoRecord) => r?.vehicleYear).filter(Boolean) as number[]
    );
    return Array.from(s).sort((a: number, b: number) => b - a);
  }, [records]);

  const filtered = useMemo(() => {
    let result = [...(records ?? [])];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r: RoRecord) =>
        (r?.roNumber ?? '').toLowerCase().includes(q) ||
        (r?.vehicleDescription ?? '').toLowerCase().includes(q) ||
        (r?.customerName ?? '').toLowerCase().includes(q) ||
        (r?.jobDescriptions ?? '').toLowerCase().includes(q) ||
        (r?.jobLines ?? []).some((line) =>
          (line?.jobDescription ?? '').toLowerCase().includes(q)
        )
      );
    }

    if (makeFilter) result = result.filter((r: RoRecord) => r?.vehicleMake === makeFilter);
    if (modelFilter) result = result.filter((r: RoRecord) => r?.vehicleModel === modelFilter);
    if (yearFilter) result = result.filter((r: RoRecord) => String(r?.vehicleYear) === yearFilter);
    if (dateFrom) result = result.filter((r: RoRecord) => (r?.roCompletedDate ?? '').slice(0, 10) >= dateFrom);
    if (dateTo) result = result.filter((r: RoRecord) => (r?.roCompletedDate ?? '').slice(0, 10) <= dateTo);

    result.sort((a: any, b: any) => {
      const aVal = sortField === 'earnedAmount' ? getRoEarned(a) : a?.[sortField] ?? '';
      const bVal = sortField === 'earnedAmount' ? getRoEarned(b) : b?.[sortField] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [records, search, makeFilter, modelFilter, yearFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.ceil((filtered?.length ?? 0) / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const exportCsv = useCallback(() => {
    const params = new URLSearchParams();
    if (makeFilter) params.set('make', makeFilter);
    if (modelFilter) params.set('model', modelFilter);
    if (yearFilter) params.set('year', yearFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (search) params.set('search', search);

    const a = document.createElement('a');
    a.href = `/api/export/csv?${params.toString()}`;
    a.download = 'ro-records.csv';
    a.click();
  }, [makeFilter, modelFilter, yearFilter, dateFrom, dateTo, search]);

  const exportPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (makeFilter) params.set('make', makeFilter);
      if (modelFilter) params.set('model', modelFilter);
      if (yearFilter) params.set('year', yearFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);

      const res = await fetch(`/api/export/pdf?${params.toString()}`);
      if (!res?.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ro-summary-report.pdf';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  }, [makeFilter, modelFilter, yearFilter, dateFrom, dateTo, search]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Records</h1>
          <p className="text-muted-foreground text-sm">
            {filtered?.length ?? 0} repair orders found
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportCsv} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button onClick={exportPdf} variant="outline" size="sm" disabled={pdfLoading}>
            <FileText className="h-4 w-4 mr-1" />
            {pdfLoading ? 'Generating...' : 'PDF'}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RO#, vehicle, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            <select
              value={makeFilter}
              onChange={(e) => {
                setMakeFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm bg-white"
            >
              <option value="">All Makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm bg-white"
            >
              <option value="">All Models</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm bg-white"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>

            <div className="flex gap-1 items-center">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="border rounded-md px-1.5 py-1.5 text-xs bg-white w-full"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="border rounded-md px-1.5 py-1.5 text-xs bg-white w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
  { key: 'roCompletedDate', label: 'Date' },
  { key: 'roNumber', label: 'RO #' },
  { key: 'vehicleDescription', label: 'Vehicle' },
  { key: 'billedHours', label: 'Hours' },
  { key: 'earnedAmount', label: 'Earned' },
  { key: 'customerName', label: 'Customer' },
].map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.roCompletedDate ? new Date(r.roCompletedDate).toLocaleDateString() : ''}
                  </td>

                  <td className="px-3 py-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(r)}
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                    >
                      {r.roNumber ?? ''}
                    </button>
                  </td>

                  <td
                    className="px-3 py-2 max-w-[200px] truncate"
                    title={r.vehicleDescription ?? ''}
                  >
                    {r.vehicleDescription ?? ''}
                  </td>

                  <td className="px-3 py-2 text-right">{r.billedHours?.toFixed?.(1) ?? '0'}</td>
<td className="px-3 py-2 text-right font-medium text-green-700">
  ${getRoEarned(r).toFixed(2)}
</td>
<td className="px-3 py-2 truncate max-w-[140px]" title={r.customerName ?? ''}>
  {r.customerName ?? ''}
</td>
                </tr>
              ))}

              {(paged?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>RO Details - {selectedRecord.roNumber}</DialogTitle>
                <DialogDescription>
                  Job detail, billed hours, applied pay rate, and earned amount.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Completed Date</div>
                  <div className="font-medium">
                    {selectedRecord.roCompletedDate
                      ? new Date(selectedRecord.roCompletedDate).toLocaleDateString()
                      : ''}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedRecord.customerName || '-'}</div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vehicle</div>
                  <div className="font-medium">{selectedRecord.vehicleDescription || '-'}</div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">RO Total Earn</div>
                  <div className="font-medium">
                    ${getRoEarned(selectedRecord).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3 font-medium">Job Lines</div>

                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">#</th>
                        <th className="px-4 py-3 text-left font-medium">Job</th>
                        <th className="px-4 py-3 text-right font-medium">Hours</th>
                        <th className="px-4 py-3 text-right font-medium">Rate</th>
                        <th className="px-4 py-3 text-right font-medium">Earned</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedRecord.jobLines ?? []).map((line) => (
                        <tr key={line.id} className="border-t">
                          <td className="px-4 py-3">{line.lineNumber ?? '-'}</td>
                          <td className="px-4 py-3 whitespace-pre-wrap">
                            {line.jobDescription || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(line.billedHours ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${(line.appliedRate ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-700">
                            ${(line.earnedAmount ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {(selectedRecord.jobLines?.length ?? 0) === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No job lines found. Re-upload CSV after schema update.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
