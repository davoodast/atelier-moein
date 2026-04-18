import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { toJalaali } from 'jalaali-js';

function todayJalaliStr() {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

// Jalali day of week: Saturday=0, Sunday=1, ..., Friday=6
function todayJalaliDow() {
  return (new Date().getDay() + 1) % 7;
}

function todayJalaliDay() {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate()).jd;
}

async function getMyEmployee(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return null;
  return prisma.employee.findUnique({ where: { user_id: authUser.id } });
}

// GET today's daily todos for current employee
export async function GET(request: Request) {
  const employee = await getMyEmployee(request);
  if (!employee) return NextResponse.json({ employee_id: null, todos: [], recurring: [] });

  const today = todayJalaliStr();
  const dow = todayJalaliDow();
  const dayOfMonth = todayJalaliDay();

  const [todos, recurringTasks, existingLogs] = await Promise.all([
    prisma.dailyTodo.findMany({
      where: { employee_id: employee.id, date_jalali: today },
      orderBy: { created_at: 'asc' },
    }),
    prisma.recurringTask.findMany({
      where: {
        employee_id: employee.id,
        is_active: true,
        OR: [
          { interval: 'daily' },
          { interval: 'weekly', day_of_week: dow },
          { interval: 'monthly', day_of_month: dayOfMonth },
        ],
      },
    }),
    prisma.taskLog.findMany({
      where: { employee_id: employee.id, date_jalali: today },
    }),
  ]);

  // Annotate recurring tasks with today's log if exists
  const recurring = recurringTasks.map((t) => {
    const log = existingLogs.find((l) => l.recurring_task_id === t.id);
    return { ...t, todayLog: log || null };
  });

  return NextResponse.json({ employee_id: employee.id, todos, recurring });
}

// POST: add a daily todo
export async function POST(request: Request) {
  const employee = await getMyEmployee(request);
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { title, date_jalali } = await request.json();
  const todo = await prisma.dailyTodo.create({
    data: { employee_id: employee.id, title, date_jalali: date_jalali || todayJalaliStr(), is_done: false },
  });
  return NextResponse.json(todo, { status: 201 });
}

// PATCH: toggle daily todo
export async function PATCH(request: Request) {
  const employee = await getMyEmployee(request);
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { todo_id, is_done } = await request.json();
  const updated = await prisma.dailyTodo.update({
    where: { id: todo_id, employee_id: employee.id },
    data: { is_done },
  });
  return NextResponse.json(updated);
}

// DELETE: remove a daily todo
export async function DELETE(request: Request) {
  const employee = await getMyEmployee(request);
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const todoId = searchParams.get('todo_id');
  if (!todoId) return NextResponse.json({ error: 'todo_id required' }, { status: 400 });

  await prisma.dailyTodo.delete({ where: { id: parseInt(todoId), employee_id: employee.id } });
  return NextResponse.json({ message: 'Deleted' });
}
