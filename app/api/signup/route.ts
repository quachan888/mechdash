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

    // Create default hourly rates for new user
    await prisma.hourlyRate.createMany({
      data: [
        { rate: 45, effectiveFrom: new Date('2015-01-01'), effectiveTo: new Date('2026-01-31'), description: 'Standard rate', userId: user.id },
        { rate: 55, effectiveFrom: new Date('2026-02-01'), effectiveTo: null, description: 'Updated rate', userId: user.id },
      ],
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: err?.message ?? 'Signup failed' }, { status: 500 });
  }
}
