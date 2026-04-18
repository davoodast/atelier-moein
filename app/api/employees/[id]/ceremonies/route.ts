import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tasks = await prisma.ceremonyTask.findMany({
    where: { employee_id: parseInt(id) },
    include: { ceremony: true },
  });

  const ceremonies = tasks.map((t) => t.ceremony);
  return NextResponse.json(ceremonies);
}
