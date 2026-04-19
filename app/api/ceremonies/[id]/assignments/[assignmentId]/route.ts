import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, assignmentId } = await params;
  const ceremonyId = parseInt(id);
  const aId = parseInt(assignmentId);
  if (isNaN(ceremonyId) || isNaN(aId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const existing = await prisma.ceremonyAssignment.findFirst({
    where: { id: aId, ceremonyId },
  });
  if (!existing) return NextResponse.json({ error: 'تخصیص یافت نشد' }, { status: 404 });

  const body = await request.json();
  const { roleId, baseFee, status } = body;

  const updated = await prisma.ceremonyAssignment.update({
    where: { id: aId },
    data: {
      ...(roleId !== undefined && { roleId: parseInt(roleId) }),
      ...(baseFee !== undefined && { baseFee: baseFee != null ? parseFloat(baseFee) : null }),
      ...(status !== undefined && { status }),
    },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true } },
      role: { select: { id: true, name: true, description: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, assignmentId } = await params;
  const ceremonyId = parseInt(id);
  const aId = parseInt(assignmentId);
  if (isNaN(ceremonyId) || isNaN(aId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const existing = await prisma.ceremonyAssignment.findFirst({
    where: { id: aId, ceremonyId },
  });
  if (!existing) return NextResponse.json({ error: 'تخصیص یافت نشد' }, { status: 404 });

  await prisma.ceremonyAssignment.delete({ where: { id: aId } });
  return NextResponse.json({ message: 'تخصیص حذف شد' });
}
