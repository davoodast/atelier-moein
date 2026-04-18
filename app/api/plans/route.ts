import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plans = await prisma.plan.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();
  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price ? parseFloat(data.price) : null,
      features: Array.isArray(data.features) ? JSON.stringify(data.features) : (data.features || '[]'),
      is_active: data.is_active ? 1 : 0,
    },
  });
  return NextResponse.json(plan, { status: 201 });
}
