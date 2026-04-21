export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    const hourlyRates = await prisma.hourlyRate.findMany({
      where: { userId },
      orderBy: { effectiveFrom: 'asc' },
    });

    const roRecords = await prisma.roRecord.findMany({
      where: { userId },
      include: {
        jobLines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
      orderBy: { roCompletedDate: 'desc' },
    });

    const paychecks = await prisma.paycheck.findMany({
      where: { userId },
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
    });

    const uploadHistory = await prisma.uploadHistory.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user,
      data: {
        hourlyRates: hourlyRates.map((r) => ({
          ...r,
          effectiveFrom: r.effectiveFrom?.toISOString?.() ?? null,
          effectiveTo: r.effectiveTo?.toISOString?.() ?? null,
          createdAt: r.createdAt?.toISOString?.() ?? null,
          updatedAt: r.updatedAt?.toISOString?.() ?? null,
        })),
        roRecords: roRecords.map((r) => ({
          ...r,
          roCompletedDate: r.roCompletedDate?.toISOString?.() ?? null,
          createdAt: r.createdAt?.toISOString?.() ?? null,
          updatedAt: r.updatedAt?.toISOString?.() ?? null,
          jobLines: (r.jobLines ?? []).map((line) => ({
            ...line,
            roCompletedDate: line.roCompletedDate?.toISOString?.() ?? null,
            createdAt: line.createdAt?.toISOString?.() ?? null,
            updatedAt: line.updatedAt?.toISOString?.() ?? null,
          })),
        })),
        paychecks: paychecks.map((p) => ({
          ...p,
          paycheckDate: p.paycheckDate?.toISOString?.() ?? null,
          createdAt: p.createdAt?.toISOString?.() ?? null,
          updatedAt: p.updatedAt?.toISOString?.() ?? null,
        })),
        uploadHistory: uploadHistory.map((h) => ({
          ...h,
          uploadedAt: h.uploadedAt?.toISOString?.() ?? null,
        })),
      },
    };

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mechdash-backup-${userId}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Backup export failed:', err);
    return NextResponse.json({ error: 'Backup export failed' }, { status: 500 });
  }
}
