import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const UpdateMessageSchema = z.object({
  status: z.enum(['unread', 'read', 'replied']).optional(),
  adminReply: z.string().max(1200).optional(),
});

function canManageInbox(role?: string, isSystem?: boolean): boolean {
  return role === 'admin' || role === 'accountant' || isSystem === true;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!canManageInbox(authUser.role, authUser.isSystem)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const messageId = parseInt(id, 10);
  if (Number.isNaN(messageId)) {
    return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = UpdateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'داده نامعتبر' }, { status: 400 });
  }

  const { status, adminReply } = parsed.data;
  const now = new Date();

  const nextStatus = adminReply?.trim() ? 'replied' : status;

  const updated = await prisma.inboxMessage.update({
    where: { id: messageId },
    data: {
      ...(nextStatus !== undefined && { status: nextStatus }),
      ...(nextStatus === 'read' && { readAt: now }),
      ...(nextStatus === 'replied' && { repliedAt: now, readAt: now }),
      ...(adminReply !== undefined && { adminReply: adminReply.trim() || null }),
    },
    include: {
      sender: { select: { id: true, username: true, phone: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
