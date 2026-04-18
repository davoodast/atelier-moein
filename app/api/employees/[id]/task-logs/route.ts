import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const logs = await prisma.taskLog.findMany({
    where: { employee_id: parseInt(id) },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
  return NextResponse.json(logs);
}

// Admin approves or rejects a deletion request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { log_id, admin_approved } = await request.json();
  const updated = await prisma.taskLog.update({
    where: { id: log_id },
    data: { admin_approved: admin_approved ? 1 : 0 },
  });
  return NextResponse.json(updated);
}

// Admin creates a log entry (e.g. mark as missed)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { title, date_jalali, is_done, recurring_task_id, note } = await request.json();

  const log = await prisma.taskLog.create({
    data: {
      employee_id: parseInt(id),
      title,
      date_jalali,
      is_done: is_done ?? false,
      recurring_task_id: recurring_task_id ? parseInt(recurring_task_id) : null,
      note: note || null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
