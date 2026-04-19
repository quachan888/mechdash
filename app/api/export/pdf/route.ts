export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request?.url ?? '');
    const make = searchParams?.get?.('make') ?? '';
    const model = searchParams?.get?.('model') ?? '';
    const year = searchParams?.get?.('year') ?? '';
    const dateFrom = searchParams?.get?.('dateFrom') ?? '';
    const dateTo = searchParams?.get?.('dateTo') ?? '';
    const search = searchParams?.get?.('search') ?? '';

    const where: any = { userId };
    if (make) where.vehicleMake = make;
    if (model) where.vehicleModel = model;
    if (year) where.vehicleYear = parseInt(year);
    if (dateFrom || dateTo) {
      where.roCompletedDate = {};
      if (dateFrom) where.roCompletedDate.gte = new Date(dateFrom);
      if (dateTo) where.roCompletedDate.lte = new Date(dateTo + 'T23:59:59');
    }
    if (search) {
      where.OR = [
        { roNumber: { contains: search, mode: 'insensitive' } },
        { vehicleDescription: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.roRecord.findMany({ where, orderBy: { roCompletedDate: 'desc' } });
    const rates = await prisma.hourlyRate.findMany({ where: { userId }, orderBy: { effectiveFrom: 'asc' } });

    const totalHours = (records ?? []).reduce((s: number, r: any) => s + (r?.billedHours ?? 0), 0);
    const totalLabor = (records ?? []).reduce((s: number, r: any) => s + (r?.laborSale ?? 0), 0);
    const totalParts = (records ?? []).reduce((s: number, r: any) => s + (r?.partsSale ?? 0), 0);
    const totalSale = (records ?? []).reduce((s: number, r: any) => s + (r?.totalSale ?? 0), 0);

    let totalEarnings = 0;
    for (const r of (records ?? [])) {
      const d = r?.roCompletedDate ? new Date(r.roCompletedDate) : new Date();
      let rate = 45;
      for (let i = (rates?.length ?? 0) - 1; i >= 0; i--) {
        const rt = rates?.[i];
        if (!rt) continue;
        const from = new Date(rt.effectiveFrom);
        const to = rt.effectiveTo ? new Date(rt.effectiveTo) : new Date('2099-12-31');
        if (d >= from && d <= to) { rate = rt?.rate ?? 45; break; }
      }
      totalEarnings += (r?.billedHours ?? 0) * rate;
    }

    const filterText = [make, model, year, dateFrom, dateTo, search].filter(Boolean).join(', ') || 'None';

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e3a5f; }
  h1 { font-size: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; }
  .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
  .stat { background: #f0f4f8; padding: 15px 20px; border-radius: 8px; min-width: 150px; }
  .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
  .stat-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
  th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; }
  td { padding: 6px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) { background: #f8f9fa; }
  .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
  .filters { font-size: 12px; color: #666; margin-bottom: 10px; }
</style></head><body>
  <h1>Repair Order Summary Report</h1>
  <p class="filters">Filters: ${filterText}</p>
  <p class="filters">Generated: ${new Date().toLocaleDateString()} | Total Records: ${records?.length ?? 0}</p>
  <div class="summary">
    <div class="stat"><div class="stat-label">Total Hours</div><div class="stat-value">${totalHours?.toFixed?.(1) ?? '0'}</div></div>
    <div class="stat"><div class="stat-label">Total Earnings</div><div class="stat-value">$${totalEarnings?.toLocaleString?.('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</div></div>
    <div class="stat"><div class="stat-label">Labor Sales</div><div class="stat-value">$${totalLabor?.toLocaleString?.('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}</div></div>
    <div class="stat"><div class="stat-label">Parts Sales</div><div class="stat-value">$${totalParts?.toLocaleString?.('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}</div></div>
    <div class="stat"><div class="stat-label">Total Sales</div><div class="stat-value">$${totalSale?.toLocaleString?.('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}</div></div>
  </div>
  <table>
    <thead><tr>
      <th>Date</th><th>RO #</th><th>Vehicle</th><th>Hours</th><th>Labor $</th><th>Parts $</th><th>Total $</th><th>Customer</th>
    </tr></thead>
    <tbody>
      ${(records ?? []).slice(0, 200).map((r: any) => `<tr>
        <td>${r?.roCompletedDate ? new Date(r.roCompletedDate).toLocaleDateString() : ''}</td>
        <td>${r?.roNumber ?? ''}</td>
        <td>${r?.vehicleDescription ?? ''}</td>
        <td>${r?.billedHours?.toFixed?.(1) ?? '0'}</td>
        <td>$${r?.laborSale?.toFixed?.(2) ?? '0.00'}</td>
        <td>$${r?.partsSale?.toFixed?.(2) ?? '0.00'}</td>
        <td>$${r?.totalSale?.toFixed?.(2) ?? '0.00'}</td>
        <td>${r?.customerName ?? ''}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${(records?.length ?? 0) > 200 ? '<p style="font-size:11px;color:#999;">Showing first 200 of ' + (records?.length ?? 0) + ' records</p>' : ''}
  <div class="footer">MechDash \u2022 Mechanic Dashboard Report</div>
</body></html>`;

    const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html,
        pdf_options: { format: 'A4', landscape: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    });

    if (!createRes?.ok) {
      return NextResponse.json({ error: 'Failed to create PDF' }, { status: 500 });
    }

    const { request_id } = await createRes.json();
    if (!request_id) return NextResponse.json({ error: 'No request ID' }, { status: 500 });

    let attempts = 0;
    while (attempts < 120) {
      await new Promise((r: any) => setTimeout(r, 1000));
      const statusRes = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });
      const statusResult = await statusRes?.json?.();
      const status = statusResult?.status ?? 'FAILED';
      if (status === 'SUCCESS' && statusResult?.result?.result) {
        const pdfBuffer = Buffer.from(statusResult.result.result, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="ro-summary-report.pdf"',
          },
        });
      } else if (status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }
    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 });
  } catch (err: any) {
    console.error('PDF export error:', err);
    return NextResponse.json({ error: 'PDF export failed' }, { status: 500 });
  }
}
