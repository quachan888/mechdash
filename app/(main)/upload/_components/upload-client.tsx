'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadClient() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!file?.name?.endsWith?.('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text, fileName: file?.name ?? 'upload.csv' }),
      });
      const data = await res?.json?.();
      if (res?.ok) {
        setResult(data);
        toast.success(`Upload complete! ${data?.newRecords ?? 0} new records added.`);
      } else {
        toast.error(data?.error ?? 'Upload failed');
      }
    } catch (err: any) {
      toast.error('Upload failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e?.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Upload CSV</h1>
        <p className="text-muted-foreground text-sm">Import technician hours from your CSV export</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-8">
          <div
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef?.current?.click?.()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              dragging ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400 hover:bg-muted/50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                <p className="text-lg font-medium">Processing CSV...</p>
                <p className="text-sm text-muted-foreground">Parsing rows, detecting duplicates, and importing records</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={(e: any) => { e?.stopPropagation?.(); fileRef?.current?.click?.(); }}>Select File</Button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e: any) => handleFile(e?.target?.files?.[0])}
            />
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="text-base">Upload Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox icon={<FileText className="h-5 w-5 text-blue-500" />} label="Total Rows" value={String(result?.totalRows ?? 0)} />
              <StatBox icon={<CheckCircle className="h-5 w-5 text-green-500" />} label="New Records" value={String(result?.newRecords ?? 0)} />
              <StatBox icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="Duplicates" value={String(result?.duplicates ?? 0)} />
              <StatBox icon={<XCircle className="h-5 w-5 text-red-500" />} label="Errors" value={String(result?.errors ?? 0)} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">Expected CSV Format</h3>
          <p className="text-sm text-muted-foreground mb-3">Your CSV should include these columns (from DMS export):</p>
          <div className="flex flex-wrap gap-2">
            {['RO Completed Date', 'Repair Order Number', 'Vehicle Description', 'Billed Hours', 'Labor Sale', 'Parts Sale', 'Sublet Sale', 'Customer Name', 'Customer Number'].map((col: string) => (
              <span key={col} className="bg-muted px-2 py-1 rounded text-xs font-mono">{col}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}
