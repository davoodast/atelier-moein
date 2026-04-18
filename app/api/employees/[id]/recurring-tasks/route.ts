import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const tasks = await prisma.recurringTask.findMany({
    where: { employee_id: parseInt(id) },
    orderBy: { created_at: 'asc' },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { title, description, interval, day_of_week, day_of_month } = await request.json();

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const task = await prisma.recurringTask.create({
    data: {
      employee_id: parseInt(id),
      title,
      description: description || null,
      interval: interval || 'weekly',
      day_of_week: day_of_week != null ? parseInt(day_of_week) : null,
      day_of_month: day_of_month != null ? parseInt(day_of_month) : null,
      is_active: true,
    },
  });
  return NextResponse.json(task, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');
  if (!taskId) return NextResponse.json({ error: 'task_id required' }, { status: 400 });

  await prisma.recurringTask.delete({ where: { id: parseInt(taskId) } });
  return NextResponse.json({ message: 'Deleted' });
}
