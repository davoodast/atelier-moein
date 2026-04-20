import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasCeremonyPermission } from '@/lib/permissions';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const allowed = await hasCeremonyPermission(authUser, ceremonyId, 'ceremonies.tasks.manage');
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const data = await request.json();

  const task = await prisma.ceremonyTask.create({
    data: {
      ceremony_id: ceremonyId,
      employee_id: parseInt(data.employee_id),
      role_description: data.role_description || null,
      attendance_hours: data.attendance_hours ? parseFloat(data.attendance_hours) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
