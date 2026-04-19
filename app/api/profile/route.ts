export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, username: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, username, email } = body;

    // Check username uniqueness
    if (username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    // Check email uniqueness
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        username: username || null,
        email: email || undefined,
        name,
      },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, username: true },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
