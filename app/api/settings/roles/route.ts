import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { canManageSystemRole } from '@/lib/accessControl';
import { z } from 'zod';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  const canViewSettings = await hasPermission(authUser, 'settings.view');
  const canManageAssignments = await hasPermission(authUser, 'ceremonies.assignments.manage');

  if (!canViewSettings && !canManageAssignments) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Users with only ceremony assignment access get non-system roles only
  const where = canViewSettings ? {} : { isSystem: false };

  const roles = await prisma.role.findMany({
    where,
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(
    roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      created_at: r.created_at,
      userCount: r._count.users,
      permissions: r.rolePermissions.map((rp) => rp.permission),
    }))
  );
}

const CreateRoleSchema = z.object({
  name: z.string().min(2, 'نام نقش باید حداقل ۲ کاراکتر باشد').max(50),
  description: z.string().max(200).nullable().optional(),
  isSystem: z.boolean().optional(),
});

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !await hasPermission(authUser, 'settings.edit')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, description, isSystem } = parsed.data;

  // Only users with role.manage_system can create system roles
  if (isSystem) {
    const canSys = await canManageSystemRole(authUser.id as number);
    if (!canSys) {
      return NextResponse.json({ error: 'فقط مدیران سیستم می‌توانند نقش سیستمی بسازند' }, { status: 403 });
    }
  }

  const exists = await prisma.role.findUnique({ where: { name } });
  if (exists) {
    return NextResponse.json({ error: 'نقشی با این نام وجود دارد' }, { status: 409 });
  }

  const role = await prisma.role.create({
    data: { name, description: description ?? null, isSystem: isSystem ?? false },
  });

  return NextResponse.json(role, { status: 201 });
}
