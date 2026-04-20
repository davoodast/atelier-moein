import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const ToggleSchema = z.object({
  permissionId: z.number().int().positive(),
  enabled: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser || !await hasPermission(authUser, 'settings.edit')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idStr } = await params;
  const roleId = parseInt(idStr);
  if (isNaN(roleId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const body = await request.json();
  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { permissionId, enabled } = parsed.data;

  const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
  if (!roleExists) return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 });

  if (enabled) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  return NextResponse.json({ ok: true });
}
