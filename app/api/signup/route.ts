export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || null },
    });

    await prisma.hourlyRate.create({
      data: {
        rate: 45,
        effectiveFrom: new Date('2025-01-01T12:00:00.000Z'),
        effectiveTo: null,
        description: 'Standard rate',
        userId: user.id,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: err?.message ?? 'Signup failed' }, { status: 500 });
  }
}
