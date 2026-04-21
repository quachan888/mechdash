export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

function parseDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRate(value: unknown) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 ? rate : null;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rates = await prisma.hourlyRate.findMany({
      where: { userId },
      orderBy: { effectiveFrom: 'asc' },
    });
    const serialized = (rates ?? []).map((r: any) => ({
      ...r,
      effectiveFrom: r?.effectiveFrom?.toISOString?.() ?? '',
      effectiveTo: r?.effectiveTo?.toISOString?.() ?? null,
      createdAt: r?.createdAt?.toISOString?.() ?? '',
      updatedAt: r?.updatedAt?.toISOString?.() ?? '',
    }));
    return NextResponse.json({ rates: serialized });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request?.json?.();
    const rateAmount = parseRate(body?.rate);
    const effectiveFrom = parseDate(body?.effectiveFrom);

    if (rateAmount == null || !effectiveFrom) {
      return NextResponse.json({ error: 'Valid rate and start date are required' }, { status: 400 });
    }

    const effectiveTo = body?.effectiveTo ? parseDate(body.effectiveTo) : null;
    if (body?.effectiveTo && !effectiveTo) {
      return NextResponse.json({ error: 'Valid end date is required' }, { status: 400 });
    }

    if (effectiveTo && effectiveTo < effectiveFrom) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const rate = await prisma.hourlyRate.create({
      data: {
        rate: rateAmount,
        effectiveFrom,
        effectiveTo,
        description: body?.description ?? null,
        userId,
      }
    });

    return NextResponse.json({ rate });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to create rate' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.hourlyRate.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rateAmount = parseRate(body?.rate);
    const effectiveFrom = parseDate(body?.effectiveFrom);
    const effectiveTo = body?.effectiveTo ? parseDate(body.effectiveTo) : null;

    if (rateAmount == null || !effectiveFrom) {
      return NextResponse.json({ error: 'Valid rate and start date are required' }, { status: 400 });
    }

    if (body?.effectiveTo && !effectiveTo) {
      return NextResponse.json({ error: 'Valid end date is required' }, { status: 400 });
    }

    if (effectiveTo && effectiveTo < effectiveFrom) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const rate = await prisma.hourlyRate.update({
      where: { id },
      data: {
        rate: rateAmount,
        effectiveFrom,
        effectiveTo,
        description: body?.description || null,
      },
    });

    return NextResponse.json({
      rate: {
        ...rate,
        effectiveFrom: rate.effectiveFrom.toISOString(),
        effectiveTo: rate.effectiveTo?.toISOString() ?? null,
        createdAt: rate.createdAt.toISOString(),
        updatedAt: rate.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to update rate' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request?.url ?? '');
    const id = searchParams?.get?.('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Verify ownership
    const rate = await prisma.hourlyRate.findFirst({ where: { id, userId } });
    if (!rate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.hourlyRate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to delete rate' }, { status: 500 });
  }
}
