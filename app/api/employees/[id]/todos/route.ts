import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const todos = await prisma.dailyTodo.findMany({
    where: {
      employee_id: parseInt(id),
      ...(date ? { date_jalali: date } : {}),
    },
    orderBy: { created_at: 'asc' },
  });

  return NextResponse.json(todos);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { title, date_jalali } = await request.json();

  if (!title || !date_jalali) {
    return NextResponse.json({ error: 'title and date_jalali are required' }, { status: 400 });
  }

  const todo = await prisma.dailyTodo.create({
    data: { employee_id: parseInt(id), title, date_jalali, is_done: false },
  });

  return NextResponse.json(todo, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { todo_id, is_done } = await request.json();

  const updated = await prisma.dailyTodo.update({
    where: { id: todo_id, employee_id: parseInt(id) },
    data: { is_done },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const todoId = searchParams.get('todo_id');

  if (!todoId) return NextResponse.json({ error: 'todo_id required' }, { status: 400 });

  await prisma.dailyTodo.delete({ where: { id: parseInt(todoId), employee_id: parseInt(id) } });
  return NextResponse.json({ message: 'Deleted' });
}
