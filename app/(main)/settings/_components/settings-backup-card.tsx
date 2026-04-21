'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsBackupCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch('/api/backup/export');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || 'mechdash-backup.json';

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    try {
      setImporting(true);

      const text = await file.text();
      let json: unknown;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON backup file');
      }

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Import failed');
      }

      toast.success(
        `Import complete. Rates: ${data?.importedRates ?? 0}, ROs: ${data?.importedRecords ?? 0}, Lines: ${data?.importedLines ?? 0}, Paychecks: ${data?.importedPaychecks ?? 0}`
      );

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      toast.error(err?.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Backup &amp; Restore</CardTitle>
        <CardDescription>
          Export all repair orders, job details, paycheck details, and hourly rate history.
          Import the same backup file on another server to restore your data.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleExport} disabled={exporting || importing} className="sm:w-auto">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Full Backup
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleImportClick}
            disabled={exporting || importing}
            className="sm:w-auto"
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import Full Backup
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Export creates one JSON backup file. Import restores hourly rates, RO records, job lines,
          paycheck details, and upload history for the current signed-in user.
        </div>
      </CardContent>
    </Card>
  );
}
