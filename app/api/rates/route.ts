export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

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
    const rate = await prisma.hourlyRate.create({
      data: {
        rate: body?.rate ?? 0,
        effectiveFrom: new Date(body?.effectiveFrom),
        effectiveTo: body?.effectiveTo ? new Date(body.effectiveTo) : null,
        description: body?.description ?? null,
        userId,
      }
    });
    return NextResponse.json({ rate });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to create rate' }, { status: 500 });
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
