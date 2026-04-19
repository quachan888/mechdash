export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  if (!userId || role !== 'admin') return null;
  return userId;
}

export async function GET() {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { roRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get stats sequentially to avoid too many connections
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const usersWithStats = [];
    for (const u of users) {
      const monthlyAgg = await prisma.roRecord.aggregate({
        where: { userId: u.id, roCompletedDate: { gte: monthStart } },
        _sum: { billedHours: true },
      });
      const yearlyAgg = await prisma.roRecord.aggregate({
        where: { userId: u.id, roCompletedDate: { gte: yearStart } },
        _sum: { billedHours: true },
      });
      const userRates = await prisma.hourlyRate.findMany({
        where: { userId: u.id },
        orderBy: { effectiveFrom: 'asc' },
      });
      const userRecords = await prisma.roRecord.findMany({
        where: { userId: u.id, billedHours: { gt: 0 } },
        select: { roCompletedDate: true, billedHours: true },
      });

      let avgEarningPerDay = 0;
      if (userRecords.length > 0) {
        let totalEarnings = 0;
        const workingDays = new Set<string>();
        userRecords.forEach((r: any) => {
          const d = r.roCompletedDate instanceof Date ? r.roCompletedDate : new Date(r.roCompletedDate);
          workingDays.add(d.toISOString().slice(0, 10));
          let rate = 45;
          for (let i = userRates.length - 1; i >= 0; i--) {
            const ur = userRates[i]!;
            const from = ur.effectiveFrom;
            const to = ur.effectiveTo ?? new Date('2099-12-31');
            if (d >= from && d <= to) { rate = ur.rate; break; }
          }
          totalEarnings += (r.billedHours ?? 0) * rate;
        });
        avgEarningPerDay = workingDays.size > 0 ? totalEarnings / workingDays.size : 0;
      }

      usersWithStats.push({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        totalROs: u._count.roRecords,
        monthlyHours: monthlyAgg._sum.billedHours ?? 0,
        yearlyHours: yearlyAgg._sum.billedHours ?? 0,
        avgEarningPerDay: Math.round(avgEarningPerDay * 100) / 100,
      });
    }

    return NextResponse.json({ users: usersWithStats });
  } catch (err) {
    console.error('Admin users GET error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { email, password, name, firstName, lastName, username, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const displayName = name || [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: displayName,
        firstName: firstName || null,
        lastName: lastName || null,
        username: username || null,
        role: role || 'user',
      },
    });

    // Create default hourly rates
    await prisma.hourlyRate.createMany({
      data: [
        { rate: 45, effectiveFrom: new Date('2024-01-01'), description: 'Default Rate', userId: user.id },
        { rate: 50, effectiveFrom: new Date('2025-01-01'), description: 'Current Rate', userId: user.id },
      ],
    });

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Admin user create error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, action, password, role, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    if (action === 'change_password') {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id }, data: { password: hashed } });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_active') {
      await prisma.user.update({ where: { id }, data: { isActive: !isActive } });
      return NextResponse.json({ success: true });
    }

    if (action === 'change_role') {
      await prisma.user.update({ where: { id }, data: { role: role || 'user' } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Admin user update error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // Prevent deleting yourself
    if (id === adminId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

    // Delete related records first
    await prisma.roRecord.deleteMany({ where: { userId: id } });
    await prisma.hourlyRate.deleteMany({ where: { userId: id } });
    await prisma.uploadHistory.deleteMany({ where: { userId: id } });
    await prisma.paycheck.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin user delete error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
