export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()), 10);

    const paychecks = await prisma.paycheck.findMany({
      where: { userId, year },
      orderBy: { weekNumber: 'asc' },
    });

    return NextResponse.json({ paychecks });
  } catch (err: any) {
    console.error('GET /api/paychecks error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { weekNumber, year, paycheckDate, grossPay, netPay, hoursReceived, notes } = body ?? {};

    if (!weekNumber || !year || !paycheckDate) {
      return NextResponse.json({ error: 'weekNumber, year, and paycheckDate are required' }, { status: 400 });
    }

    const paycheck = await prisma.paycheck.upsert({
      where: { week_year_user: { weekNumber: Number(weekNumber), year: Number(year), userId } },
      create: {
        weekNumber: Number(weekNumber),
        year: Number(year),
        paycheckDate: new Date(paycheckDate),
        grossPay: Number(grossPay ?? 0),
        netPay: Number(netPay ?? 0),
        hoursReceived: Number(hoursReceived ?? 0),
        notes: notes ?? null,
        userId,
      },
      update: {
        paycheckDate: new Date(paycheckDate),
        grossPay: Number(grossPay ?? 0),
        netPay: Number(netPay ?? 0),
        hoursReceived: Number(hoursReceived ?? 0),
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ paycheck });
  } catch (err: any) {
    console.error('POST /api/paychecks error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const paycheck = await prisma.paycheck.findFirst({ where: { id, userId } });
    if (!paycheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.paycheck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/paychecks error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to delete' }, { status: 500 });
  }
}
