import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const todos = await prisma.ceremonyTodo.findMany({
    where: {
      assignment: { userId: authUser.id as number },
    },
    include: {
      ceremony: {
        select: {
          id: true,
          type: true,
          groom_name: true,
          bride_name: true,
          date_jalali: true,
        },
      },
      assignment: {
        include: {
          role: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(todos);
}
