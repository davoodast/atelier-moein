import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasPermission, DEFAULT_PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const permissions = await prisma.permission.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  });

  return NextResponse.json(permissions);
}

const CreatePermissionSchema = z.object({
  key: z.string().min(3).max(80),
  label_fa: z.string().min(2).max(100),
  group: z.string().min(1).max(50),
  description: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!await hasPermission(authUser, 'settings.edit')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Seed mode: create all default permissions at once
  if (body?.seed === true) {
    await Promise.all(
      DEFAULT_PERMISSIONS.map((p) =>
        prisma.permission.upsert({
          where: { key: p.key },
          update: {},
          create: p,
        })
      )
    );
    const all = await prisma.permission.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return NextResponse.json(all, { status: 201 });
  }

  const parsed = CreatePermissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { key, label_fa, group, description } = parsed.data;
  const exists = await prisma.permission.findUnique({ where: { key } });
  if (exists) {
    return NextResponse.json({ error: 'مجوزی با این کلید وجود دارد' }, { status: 409 });
  }

  const perm = await prisma.permission.create({
    data: { key, label_fa, group, description: description ?? null },
  });

  return NextResponse.json(perm, { status: 201 });
}
