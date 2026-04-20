import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id as number } });
  if (!employee) return NextResponse.json([]);

  const payrolls = await prisma.payroll.findMany({
    where: { employee_id: employee.id },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(payrolls);
}
