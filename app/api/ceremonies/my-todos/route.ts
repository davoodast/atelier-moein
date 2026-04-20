import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseJalaliDateTime } from '@/lib/jalaliDateTime';

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

  const now = new Date();
  const enriched = todos.map((todo) => {
    const deadline =
      todo.dueAt ?? parseJalaliDateTime(todo.ceremony?.date_jalali, todo.ceremony?.time);
    const isOverdue = todo.status === 'pending' && !!deadline && now > deadline;
    const canMarkDone = todo.status !== 'pending' || !deadline || now >= deadline;

    return {
      ...todo,
      deadlineAt: deadline ? deadline.toISOString() : null,
      isOverdue,
      canMarkDone,
    };
  });

  return NextResponse.json(enriched);
}
