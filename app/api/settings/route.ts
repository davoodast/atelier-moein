import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.settings.findFirst();
  return NextResponse.json(settings || {});
}

export async function PUT(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      company_name: data.company_name ?? data.studio_name ?? undefined,
      contact_phone: data.contact_phone ?? data.phone ?? undefined,
      address: data.address ?? undefined,
      about_us: data.about_us ?? undefined,
      contact_email: data.contact_email ?? undefined,
    },
    create: {
      id: 1,
      company_name: data.company_name || data.studio_name || 'آتلیه معین',
      contact_phone: data.contact_phone || data.phone || null,
      address: data.address || null,
      about_us: data.about_us || null,
      contact_email: data.contact_email || null,
    },
  });

  return NextResponse.json(settings);
}
