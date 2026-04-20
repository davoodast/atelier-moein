import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasCeremonyPermission } from '@/lib/permissions';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, taskId } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const allowed = await hasCeremonyPermission(authUser, ceremonyId, 'ceremonies.tasks.manage');
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  await prisma.ceremonyTask.delete({ where: { id: parseInt(taskId) } });
  return NextResponse.json({ message: 'Deleted' });
}
