import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { canManageSystemRole } from '@/lib/accessControl';
import { z } from 'zod';

const UpdateRoleSchema = z.object({
  name: z.string().min(2, 'نام نقش باید حداقل ۲ کاراکتر باشد').max(50).optional(),
  description: z.string().max(200).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser || !await hasPermission(authUser, 'settings.edit')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const body = await request.json();
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, description } = parsed.data;

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 });

  if (name && name !== existing.name) {
    if (existing.isSystem) {
      const canSys = await canManageSystemRole(authUser.id as number);
      if (!canSys) {
        return NextResponse.json({ error: 'نقش‌های سیستمی فقط توسط مدیران سیستم قابل ویرایش هستند' }, { status: 403 });
      }
    }
    const dup = await prisma.role.findFirst({ where: { name, NOT: { id } } });
    if (dup) return NextResponse.json({ error: 'نقشی با این نام وجود دارد' }, { status: 409 });
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json(role);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser || !await hasPermission(authUser, 'settings.edit')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 });

  if (role.isSystem) {
    const canSys = await canManageSystemRole(authUser.id as number);
    if (!canSys) {
      return NextResponse.json({ error: 'نقش‌های سیستمی فقط توسط مدیران سیستم قابل حذف هستند' }, { status: 403 });
    }
  }
  if (role._count.users > 0) {
    return NextResponse.json(
      { error: `این نقش به ${role._count.users} کاربر اختصاص دارد و قابل حذف نیست` },
      { status: 400 }
    );
  }

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
