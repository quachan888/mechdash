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

    const records = await prisma.roRecord.findMany({
      where: { userId },
      include: {
        jobLines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
      orderBy: { roCompletedDate: 'desc' },
    });

    const serialized = records.map((r: any) => ({
      ...r,
      roCompletedDate: r.roCompletedDate?.toISOString?.() ?? '',
      createdAt: r.createdAt?.toISOString?.() ?? '',
      updatedAt: r.updatedAt?.toISOString?.() ?? '',
      jobLines: (r.jobLines ?? []).map((line: any) => ({
        ...line,
        roCompletedDate: line.roCompletedDate?.toISOString?.() ?? '',
        createdAt: line.createdAt?.toISOString?.() ?? '',
        updatedAt: line.updatedAt?.toISOString?.() ?? '',
      })),
    }));

    return NextResponse.json({ records: serialized });
  } catch (err: any) {
    console.error('Error fetching records:', err);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}