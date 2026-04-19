import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const task = await prisma.ceremonyTask.create({
    data: {
      ceremony_id: parseInt(id),
      employee_id: parseInt(data.employee_id),
      role_description: data.role_description || null,
      attendance_hours: data.attendance_hours ? parseFloat(data.attendance_hours) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
