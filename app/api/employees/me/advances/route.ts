import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id as number } });
  if (!employee) return NextResponse.json([]);

  const advances = await prisma.advance.findMany({
    where: { employee_id: employee.id },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(advances);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { user_id: authUser.id as number } });
  if (!employee) return NextResponse.json({ error: 'پروفایل کارمندی ندارید. لطفاً با مدیر تماس بگیرید.' }, { status: 400 });

  const { amount, date_jalali, reason } = await request.json();
  if (!amount || !reason?.trim()) {
    return NextResponse.json({ error: 'مبلغ و دلیل الزامی است' }, { status: 400 });
  }

  const advance = await prisma.advance.create({
    data: {
      employee_id: employee.id,
      amount: parseFloat(String(amount)),
      date_jalali: date_jalali || null,
      reason: reason.trim(),
      status: 'pending',
    },
  });

  return NextResponse.json(advance, { status: 201 });
}
