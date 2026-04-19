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
    
    const headers = ['RO Completed Date', 'RO Number', 'Vehicle', 'Year', 'Make', 'Model', 'Billed Hours', 'Labor Sale', 'Parts Sale', 'Sublet Sale', 'Total Sale', 'Customer', 'Job Descriptions'];
    const csvRows = [headers.join(',')];
    
    for (const r of (records ?? [])) {
      const row = [
        r?.roCompletedDate ? new Date(r.roCompletedDate).toLocaleDateString() : '',
        `"${(r?.roNumber ?? '').replace(/"/g, '""')}"`,
        `"${(r?.vehicleDescription ?? '').replace(/"/g, '""')}"`,
        String(r?.vehicleYear ?? ''),
        r?.vehicleMake ?? '',
        r?.vehicleModel ?? '',
        String(r?.billedHours ?? 0),
        String(r?.laborSale ?? 0),
        String(r?.partsSale ?? 0),
        String(r?.subletSale ?? 0),
        String(r?.totalSale ?? 0),
        `"${(r?.customerName ?? '').replace(/"/g, '""')}"`,
        `"${(r?.jobDescriptions ?? '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ro-records.csv"',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
