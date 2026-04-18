import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const payment = await prisma.ceremonyPayment.create({
    data: {
      ceremony_id: parseInt(id),
      amount: parseFloat(data.amount),
      due_date: data.payment_date || data.due_date || null,
      type: data.method || data.type || 'cash',
      status: data.status || 'paid',
    },
  });

  // Update advance_paid in ceremony
  const payments = await prisma.ceremonyPayment.findMany({ where: { ceremony_id: parseInt(id) } });
  const totalPaid = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  await prisma.ceremony.update({ where: { id: parseInt(id) }, data: { advance_paid: totalPaid } });

  return NextResponse.json(payment, { status: 201 });
}
