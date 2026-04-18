import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) },
    include: { user: { include: { role: true } } },
  });

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: employee.id,
    user_id: employee.user_id,
    username: employee.user?.username || '',
    email: employee.user?.email || null,
    phone: employee.user?.phone || null,
    bank_account: employee.user?.bank_account || null,
    position: employee.position,
    salary: employee.salary,
    status: employee.status,
    start_date: employee.start_date,
    role: employee.user?.role?.name || 'employee',
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const employee = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updatedEmployee = await prisma.employee.update({
    where: { id: parseInt(id) },
    data: {
      position: data.position ?? undefined,
      salary: data.salary !== undefined ? parseFloat(data.salary) : undefined,
      status: data.status ?? undefined,
      start_date: data.start_date ?? undefined,
      work_description: data.work_description ?? undefined,
      work_hours: data.work_hours !== undefined ? parseFloat(data.work_hours) : undefined,
      attendance_hours: data.attendance_hours !== undefined ? parseFloat(data.attendance_hours) : undefined,
    },
  });

  if (data.email !== undefined || data.phone !== undefined || data.bank_account !== undefined) {
    await prisma.user.update({
      where: { id: employee.user_id },
      data: {
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        bank_account: data.bank_account ?? undefined,
      },
    });
  }

  return NextResponse.json(updatedEmployee);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.employee.delete({ where: { id: parseInt(id) } });
  await prisma.user.delete({ where: { id: employee.user_id } });

  return NextResponse.json({ message: 'Deleted' });
}
