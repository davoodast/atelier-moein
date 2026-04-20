import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const CreateMessageSchema = z.object({
  body: z.string().min(2, 'متن پیام خیلی کوتاه است').max(1200, 'پیام خیلی طولانی است'),
});

function canManageInbox(role?: string): boolean {
  return role === 'admin' || role === 'accountant';
}

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminLike = canManageInbox(authUser.role);

  if (adminLike) {
    const [messages, unreadCount] = await Promise.all([
      prisma.inboxMessage.findMany({
        include: {
          sender: { select: { id: true, username: true, phone: true, email: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 200,
      }),
      prisma.inboxMessage.count({ where: { status: 'unread' } }),
    ]);

    return NextResponse.json({ role: 'admin', unreadCount, messages });
  }

  const messages = await prisma.inboxMessage.findMany({
    where: { senderUserId: authUser.id as number },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ role: 'user', messages });
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = CreateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'داده نامعتبر' }, { status: 400 });
  }

  const message = await prisma.inboxMessage.create({
    data: {
      senderUserId: authUser.id as number,
      body: parsed.data.body.trim(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
