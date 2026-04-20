import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { isAssignedToCeremony } from '@/lib/permissions';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['pending', 'done', 'approved', 'rejected']).optional(),
  adminNote: z.string().max(500).optional(),
  penaltyPoints: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; todoId: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, todoId } = await params;
  const ceremonyId = parseInt(id);
  const tId = parseInt(todoId);
  if (isNaN(ceremonyId) || isNaN(tId)) {
    return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
  }

  const canAccess = await isAssignedToCeremony(authUser, ceremonyId);
  if (!canAccess) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const todo = await prisma.ceremonyTodo.findFirst({
    where: { id: tId, ceremonyId },
    include: { assignment: { select: { userId: true } } },
  });
  if (!todo) return NextResponse.json({ error: 'تودو یافت نشد' }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { status, adminNote, penaltyPoints } = parsed.data;
  const admin = isAdmin(authUser);

  // Non-admin can only mark their own todo as done/pending
  if (!admin) {
    if (todo.assignment.userId !== (authUser.id as number)) {
      return NextResponse.json({ error: 'این تودو متعلق به شما نیست' }, { status: 403 });
    }
    if (status && !['pending', 'done'].includes(status)) {
      return NextResponse.json({ error: 'فقط مدیر می‌تواند تایید یا رد کند' }, { status: 403 });
    }
    if (adminNote !== undefined || penaltyPoints !== undefined) {
      return NextResponse.json({ error: 'فقط مدیر می‌تواند یادداشت و امتیاز تنظیم کند' }, { status: 403 });
    }
  }

  const updated = await prisma.ceremonyTodo.update({
    where: { id: tId },
    data: {
      ...(status !== undefined && { status }),
      ...(admin && adminNote !== undefined && { adminNote }),
      ...(admin && penaltyPoints !== undefined && { penaltyPoints }),
    },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, username: true } },
          role: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}
