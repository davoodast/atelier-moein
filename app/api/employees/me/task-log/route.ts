import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { toJalaali } from 'jalaali-js';

function todayJalaliStr() {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

// Get task logs for the current employee
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const logs = await prisma.taskLog.findMany({
    where: { employee_id: employee.id },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  return NextResponse.json(logs);
}

// Employee requests deletion of a log entry
export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { log_id, reason } = await request.json();
  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.taskLog.update({
    where: { id: log_id, employee_id: employee.id },
    data: { delete_requested: true, delete_reason: reason || null },
  });
  return NextResponse.json(updated);
}

// Mark recurring task as done for today (creates log)
export async function PUT(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recurring_task_id, is_done } = await request.json();
  const isDone = is_done !== undefined ? Boolean(is_done) : true;
  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const today = todayJalaliStr();
  const task = await prisma.recurringTask.findUnique({ where: { id: parseInt(recurring_task_id) } });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Upsert: don't create duplicate log
  const existing = await prisma.taskLog.findFirst({
    where: { employee_id: employee.id, recurring_task_id: task.id, date_jalali: today },
  });

  if (existing) {
    const updated = await prisma.taskLog.update({
      where: { id: existing.id },
      data: { is_done: isDone },
    });
    return NextResponse.json(updated);
  }

  const log = await prisma.taskLog.create({
    data: {
      employee_id: employee.id,
      recurring_task_id: task.id,
      title: task.title,
      date_jalali: today,
      is_done: isDone,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
