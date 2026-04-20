import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { user_id: authUser.id as number },
  });

  // CeremonyTask entries (old system)
  const taskItems = employee
    ? await prisma.ceremonyTask.findMany({
        where: { employee_id: employee.id },
        include: { ceremony: true },
      })
    : [];

  // CeremonyAssignment entries (role-based system)
  const assignmentItems = await prisma.ceremonyAssignment.findMany({
    where: { userId: authUser.id as number },
    include: {
      ceremony: true,
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const fromTasks = taskItems.map((t) => ({
    source: 'task' as const,
    ceremony_id: t.ceremony_id,
    date_jalali: t.ceremony.date_jalali,
    type: t.ceremony.type,
    groom_name: t.ceremony.groom_name,
    bride_name: t.ceremony.bride_name,
    time: t.ceremony.time,
    address: t.ceremony.address,
    status: t.ceremony.status,
    role_description: t.role_description || '',
    attendance_hours: t.attendance_hours || 0,
    role_name: null,
    base_fee: null,
    assignment_status: null,
  }));

  const fromAssignments = assignmentItems.map((a) => {
    const permKeys = a.role.rolePermissions.map((rp) => rp.permission.key);
    return {
      source: 'assignment' as const,
      ceremony_id: a.ceremonyId,
      date_jalali: a.ceremony.date_jalali,
      type: a.ceremony.type,
      groom_name: a.ceremony.groom_name,
      bride_name: a.ceremony.bride_name,
      time: a.ceremony.time,
      address: a.ceremony.address,
      status: a.ceremony.status,
      role_description: a.role.name,
      attendance_hours: 0,
      role_name: a.role.name,
      base_fee: a.baseFee,
      assignment_status: a.status,
      permissions: permKeys,
      canManage: permKeys.includes('ceremonies.assignments.manage'),
      canCreateTodo: permKeys.includes('ceremonies.tasks.manage'),
      canApproveTodo: permKeys.includes('ceremonies.tasks.manage'),
    };
  });

  // Merge: avoid duplicate ceremony_id entries (assignment takes precedence)
  const assignedCeremonyIds = new Set(fromAssignments.map((a) => a.ceremony_id));
  const dedupedTasks = fromTasks.filter((t) => !assignedCeremonyIds.has(t.ceremony_id));

  return NextResponse.json([...fromAssignments, ...dedupedTasks]);
}
