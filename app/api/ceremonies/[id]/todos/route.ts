import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { isAssignedToCeremony, hasCeremonyPermission } from '@/lib/permissions';
import { z } from 'zod';

const CreateTodoSchema = z.object({
  assignmentId: z.number().int().positive(),
  title: z.string().min(1, 'عنوان الزامی است').max(200),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  const canAccess = await isAssignedToCeremony(authUser, ceremonyId);
  if (!canAccess) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const where = isAdmin(authUser)
    ? { ceremonyId }
    : {
        ceremonyId,
        assignment: { userId: authUser.id as number },
      };

  const todos = await prisma.ceremonyTodo.findMany({
    where,
    include: {
      assignment: {
        include: {
          user: { select: { id: true, username: true } },
          role: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(todos);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  // Only admin or users with manage permission can create todos
  const allowed = await hasCeremonyPermission(authUser, ceremonyId, 'ceremonies.tasks.manage');
  if (!allowed) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

  const body = await request.json();
  const parsed = CreateTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { assignmentId, title, description, priority } = parsed.data;

  // Verify assignment belongs to this ceremony
  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { id: assignmentId, ceremonyId },
  });
  if (!assignment) {
    return NextResponse.json({ error: 'تخصیص یافت نشد یا متعلق به این مراسم نیست' }, { status: 404 });
  }

  const todo = await prisma.ceremonyTodo.create({
    data: {
      ceremonyId,
      assignmentId,
      title,
      description: description ?? null,
      priority: priority ?? 1,
    },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, username: true } },
          role: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
