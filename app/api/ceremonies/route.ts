import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ceremonies = await prisma.ceremony.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  return NextResponse.json(ceremonies);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();
  const ceremony = await prisma.ceremony.create({
    data: {
      type: data.type,
      groom_name: data.groom_name || null,
      bride_name: data.bride_name || null,
      date_jalali: data.date_jalali || null,
      time: data.time || null,
      address: data.address || null,
      total_amount: data.total_amount ? parseFloat(data.total_amount) : null,
      advance_paid: data.advance_paid ? parseFloat(data.advance_paid) : null,
      status: data.status || 'booked',
      plan_details: data.plan_details || data.notes || null,
    },
  });
  return NextResponse.json(ceremony, { status: 201 });
}
