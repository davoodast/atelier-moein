import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { isAssignedToCeremony } from '@/lib/permissions';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const canAccess = await isAssignedToCeremony(authUser, ceremonyId);
  if (!canAccess) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const ceremony = await prisma.ceremony.findUnique({
    where: { id: ceremonyId },
    include: {
      payments: true,
      tasks: {
        include: { employee: { include: { user: true } } },
      },
      assignments: {
        include: {
          user: { select: { id: true, username: true, email: true, phone: true } },
          role: { select: { id: true, name: true, description: true, isSystem: true } },
        },
        orderBy: { assignedAt: 'asc' },
      },
    },
  });

  if (!ceremony) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = {
    ...ceremony,
    tasks: ceremony.tasks.map((t) => ({
      id: t.id,
      employee_id: t.employee_id,
      ceremony_id: t.ceremony_id,
      role_description: t.role_description,
      attendance_hours: t.attendance_hours,
      username: t.employee?.user?.username || '',
      position: t.employee?.position || '',
    })),
    assignments: ceremony.assignments,
  };

  return NextResponse.json(result);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const ceremony = await prisma.ceremony.update({
    where: { id: parseInt(id) },
    data: {
      type: data.type,
      groom_name: data.groom_name || null,
      bride_name: data.bride_name || null,
      date_jalali: data.date_jalali || null,
      time: data.time || null,
      address: data.address || null,
      total_amount: data.total_amount != null ? parseFloat(data.total_amount) : null,
      advance_paid: data.advance_paid != null ? parseFloat(data.advance_paid) : 0,
      status: data.status || 'booked',
      plan_id: data.plan_id !== undefined ? (data.plan_id ? parseInt(data.plan_id) : null) : undefined,
      plan_details: data.plan_details || data.notes || null,
      ceremony_mode: data.ceremony_mode || undefined,
    },
  });

  return NextResponse.json(ceremony);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.ceremony.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: 'Deleted' });
}
