import { prisma } from '@/lib/prisma';

/**
 * Pure helper: check if a user has at least one of the required permissions.
 * Handles the wildcard '*' (admin shorthand).
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some((req) => userPermissions.includes(req));
}

/**
 * Check if a user has a specific permission for a specific ceremony,
 * based on their active assignment role in that ceremony.
 * Admin role always returns true.
 */
export async function hasCeremonyPermission(
  userId: number,
  ceremonyId: number,
  permissionKey: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user?.role) return false;
  if (user.role.name === 'admin') return true;

  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { userId, ceremonyId, status: 'active' },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });
  if (!assignment) return false;
  return assignment.role.rolePermissions.some((rp) => rp.permission.key === permissionKey);
}

/**
 * Get all permission keys for a user in a specific ceremony.
 * Returns ['*'] for admin.
 */
export async function getUserCeremonyPermissions(
  userId: number,
  ceremonyId: number
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user?.role) return [];
  if (user.role.name === 'admin') return ['*'];

  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { userId, ceremonyId, status: 'active' },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });
  if (!assignment) return [];
  return assignment.role.rolePermissions.map((rp) => rp.permission.key);
}

/**
 * Check if a user can manage system roles.
 * Returns true for admin role or users with 'role.manage_system' permission.
 */
export async function canManageSystemRole(userId: number): Promise<boolean> {
  return hasGlobalPermission(userId, 'role.manage_system');
}

/**
 * Check if a user has a specific global permission (based on their assigned role).
 * Admin role always returns true.
 */
export async function hasGlobalPermission(
  userId: number,
  permissionKey: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user?.role) return false;
  if (user.role.name === 'admin') return true;

  return user.role.rolePermissions.some((rp) => rp.permission.key === permissionKey);
}

/**
 * Get all effective global permission keys for a user.
 * Returns ['*'] for admin (all permissions).
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user?.role) return [];
  if (user.role.name === 'admin') return ['*'];

  return user.role.rolePermissions.map((rp) => rp.permission.key);
}
