import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { user_id: authUser.id as number },
  });

  if (!employee) return NextResponse.json([]);

  const tasks = await prisma.ceremonyTask.findMany({
    where: { employee_id: employee.id },
    include: { ceremony: true },
  });

  const result = tasks.map((t) => ({
    ceremony_id: t.ceremony_id,
    date_jalali: t.ceremony.date_jalali,
    type: t.ceremony.type,
    groom_name: t.ceremony.groom_name,
    bride_name: t.ceremony.bride_name,
    time: t.ceremony.time,
    address: t.ceremony.address,
    status: t.ceremony.status,
    role_description: t.role_description || '',
    attendance_hours: t.attendance_hours || 0,
  }));

  return NextResponse.json(result);
}
