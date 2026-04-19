import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const assignments = await prisma.ceremonyAssignment.findMany({
    where: { ceremonyId },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true } },
      role: { select: { id: true, name: true, description: true } },
    },
    orderBy: { assignedAt: 'asc' },
  });

  return NextResponse.json(assignments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const ceremony = await prisma.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return NextResponse.json({ error: 'مراسم یافت نشد' }, { status: 404 });

  const body = await request.json();
  const { userId, roleId, baseFee, status } = body;

  if (!userId || !roleId) {
    return NextResponse.json({ error: 'کاربر و نقش الزامی هستند' }, { status: 400 });
  }

  const userExists = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  if (!userExists) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  const roleExists = await prisma.role.findUnique({ where: { id: parseInt(roleId) } });
  if (!roleExists) return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 });

  const existing = await prisma.ceremonyAssignment.findUnique({
    where: { ceremonyId_userId: { ceremonyId, userId: parseInt(userId) } },
  });
  if (existing) {
    return NextResponse.json({ error: 'این کاربر قبلاً به این مراسم تخصیص یافته است' }, { status: 409 });
  }

  const assignment = await prisma.ceremonyAssignment.create({
    data: {
      ceremonyId,
      userId: parseInt(userId),
      roleId: parseInt(roleId),
      baseFee: baseFee != null ? parseFloat(baseFee) : null,
      status: status || 'active',
    },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true } },
      role: { select: { id: true, name: true, description: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
