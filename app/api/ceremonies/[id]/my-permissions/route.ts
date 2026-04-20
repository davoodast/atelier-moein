import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

/**
 * Returns the permissions the current user has for a specific ceremony,
 * based on their active assignment role for that ceremony.
 * Admin gets all permissions.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ceremonyId = parseInt(id);
  if (isNaN(ceremonyId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

  if (isAdmin(authUser)) {
    return NextResponse.json({ permissions: ['*'], role: 'admin' });
  }

  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { userId: authUser.id as number, ceremonyId, status: 'active' },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ permissions: [], role: null });
  }

  const permissions = assignment.role.rolePermissions.map((rp) => rp.permission.key);

  return NextResponse.json({
    permissions,
    role: assignment.role.name,
    roleId: assignment.role.id,
    assignmentId: assignment.id,
    baseFee: assignment.baseFee,
    status: assignment.status,
  });
}
