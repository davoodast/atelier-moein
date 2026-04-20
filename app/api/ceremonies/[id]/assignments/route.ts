import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasCeremonyPermission, isAssignedToCeremony } from '@/lib/permissions';
import { canManageSystemRole } from '@/lib/accessControl';
import { z } from 'zod';

const AssignSchema = z.object({
  userId: z.number({ required_error: 'کاربر الزامی است' }).int().positive(),
  roleId: z.number({ required_error: 'نقش الزامی است' }).int().positive(),
  baseFee: z.number().positive().nullable().optional(),
  status: z.enum(['active', 'inactive', 'cancelled']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const canView = await isAssignedToCeremony(authUser, ceremonyId);
  if (!canView) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const assignments = await prisma.ceremonyAssignment.findMany({
    where: { ceremonyId },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true } },
      role: { select: { id: true, name: true, description: true, isSystem: true } },
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

  const allowed = await hasCeremonyPermission(authUser, ceremonyId, 'ceremonies.assignments.manage');
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const ceremony = await prisma.ceremony.findUnique({ where: { id: ceremonyId } });
  if (!ceremony) return NextResponse.json({ error: 'مراسم یافت نشد' }, { status: 404 });

  const body = await request.json();
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { userId, roleId, baseFee, status } = parsed.data;

  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
  if (!roleExists) return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 });

  // Block assigning system roles to non-system-managers
  if (roleExists.isSystem) {
    const canSys = await canManageSystemRole(authUser.id as number);
    if (!canSys) {
      return NextResponse.json({ error: 'نقش‌های سیستمی فقط توسط مدیران سیستم قابل اختصاص هستند' }, { status: 403 });
    }
  }

  const existing = await prisma.ceremonyAssignment.findUnique({
    where: { ceremonyId_userId: { ceremonyId, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'این کاربر قبلاً به این مراسم تخصیص یافته است' }, { status: 409 });
  }

  const assignment = await prisma.ceremonyAssignment.create({
    data: {
      ceremonyId,
      userId,
      roleId,
      baseFee: baseFee ?? null,
      status: status ?? 'active',
    },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true } },
      role: { select: { id: true, name: true, description: true, isSystem: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
