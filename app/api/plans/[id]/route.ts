import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const plan = await prisma.plan.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price ? parseFloat(data.price) : null,
      features: Array.isArray(data.features) ? JSON.stringify(data.features) : (data.features || '[]'),
      is_active: data.is_active ? 1 : 0,
    },
  });
  return NextResponse.json(plan);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.plan.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: 'Deleted' });
}
