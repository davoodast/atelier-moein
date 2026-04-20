/**
 * Client-safe permission helpers (no Prisma imports).
 * These can be used in 'use client' components.
 */

/**
 * Check if the user holds at least one of the required permissions.
 * Handles the wildcard '*' (returned for admin).
 */
export function hasAnyPermission(
  userPermissions: string[] | undefined | null,
  requiredPermissions: string[]
): boolean {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some((req) => userPermissions.includes(req));
}

/**
 * Check if the user can manage system roles.
 * Returns true for admin ('*') or users with 'role.manage_system' permission.
 */
export function canManageSystemRoles(
  userPermissions: string[] | undefined | null
): boolean {
  return hasAnyPermission(userPermissions, ['role.manage_system']);
}

/**
 * Check if a user is a system-level user (admin-equivalent).
 * True if isSystem flag is set on their role OR they have '*' permissions.
 */
export function isSystemUser(
  userPermissions: string[] | undefined | null,
  isSystem?: boolean
): boolean {
  return isSystem === true || hasAnyPermission(userPermissions, ['*']);
}
