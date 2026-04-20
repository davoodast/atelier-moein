import { prisma } from '@/lib/prisma';
import type { JWTPayload } from '@/lib/auth';

/**
 * Check if a user has a specific permission for a specific ceremony.
 * Admin always passes.
 * Checks if user has an active assignment in that ceremony with a role that has the permission.
 */
export async function hasCeremonyPermission(
  authUser: JWTPayload | null,
  ceremonyId: number,
  key: string
): Promise<boolean> {
  if (!authUser) return false;
  if (authUser.role === 'admin') return true;

  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { userId: authUser.id as number, ceremonyId, status: 'active' },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });

  if (!assignment) return false;
  return assignment.role.rolePermissions.some((rp) => rp.permission.key === key);
}

/**
 * Check if a user is assigned to a specific ceremony (any active assignment).
 */
export async function isAssignedToCeremony(
  authUser: JWTPayload | null,
  ceremonyId: number
): Promise<boolean> {
  if (!authUser) return false;
  if (authUser.role === 'admin') return true;

  const assignment = await prisma.ceremonyAssignment.findFirst({
    where: { userId: authUser.id as number, ceremonyId, status: 'active' },
  });
  return !!assignment;
}

/**
 * Check if a user has a specific permission key.
 * Admin role always passes all permission checks.
 * Merges: global role permissions + active ceremony assignment role permissions.
 */
export async function hasPermission(
  authUser: JWTPayload | null,
  key: string
): Promise<boolean> {
  if (!authUser) return false;
  if (authUser.role === 'admin') return true;

  // 1. Check global role permissions
  const role = await prisma.role.findUnique({
    where: { name: authUser.role },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (role?.rolePermissions.some((rp) => rp.permission.key === key)) return true;

  // 2. Check active ceremony assignment role permissions
  const ceremonyRoles = await prisma.ceremonyAssignment.findMany({
    where: { userId: authUser.id as number, status: 'active' },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });

  return ceremonyRoles.some((ca) =>
    ca.role.rolePermissions.some((rp) => rp.permission.key === key)
  );
}

/**
 * Get all effective permission keys for a user.
 * Merges: global role permissions + active ceremony assignment role permissions.
 * Returns ['*'] for admin (all permissions).
 */
export async function getEffectivePermissions(
  userId: number,
  roleName: string
): Promise<string[]> {
  // admin and accountant always get full access
  if (roleName === 'admin' || roleName === 'accountant') return ['*'];

  const permKeys = new Set<string>();

  // Global role permissions
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: { rolePermissions: { include: { permission: true } } },
  });
  role?.rolePermissions.forEach((rp) => permKeys.add(rp.permission.key));

  // Active ceremony assignment role permissions
  const assignments = await prisma.ceremonyAssignment.findMany({
    where: { userId, status: 'active' },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });
  assignments.forEach((ca) =>
    ca.role.rolePermissions.forEach((rp) => permKeys.add(rp.permission.key))
  );

  return Array.from(permKeys);
}

/** Default permissions to seed on first use */
export const DEFAULT_PERMISSIONS = [
  // ── مراسم ────────────────────────────────────────────────────────────────
  { key: 'ceremonies.view',               label_fa: 'مشاهده مراسم',                  group: 'مراسم' },
  { key: 'ceremonies.create',             label_fa: 'ایجاد مراسم',                    group: 'مراسم' },
  { key: 'ceremonies.edit',               label_fa: 'ویرایش مراسم',                   group: 'مراسم' },
  { key: 'ceremonies.delete',             label_fa: 'حذف مراسم',                      group: 'مراسم' },
  { key: 'ceremonies.assignments.manage', label_fa: 'مدیریت نفرات مراسم',             group: 'مراسم' },
  { key: 'ceremonies.tasks.manage',       label_fa: 'مدیریت وظایف مراسم',             group: 'مراسم' },
  { key: 'ceremonies.payments.manage',    label_fa: 'مدیریت پرداخت‌های مراسم',        group: 'مراسم' },
  // ── پرسنل ────────────────────────────────────────────────────────────────
  { key: 'employees.view',                label_fa: 'مشاهده پرسنل',                   group: 'پرسنل' },
  { key: 'employees.create',              label_fa: 'ایجاد پرسنل',                    group: 'پرسنل' },
  { key: 'employees.edit',                label_fa: 'ویرایش پرسنل',                   group: 'پرسنل' },
  { key: 'employees.delete',              label_fa: 'حذف پرسنل',                      group: 'پرسنل' },
  { key: 'employees.tasks.manage',        label_fa: 'مدیریت وظایف پرسنل',             group: 'پرسنل' },
  // ── مالی ─────────────────────────────────────────────────────────────────
  { key: 'payments.view',                 label_fa: 'مشاهده پرداخت‌ها',               group: 'مالی' },
  { key: 'payments.create',              label_fa: 'ثبت پرداخت',                      group: 'مالی' },
  { key: 'payments.edit',                label_fa: 'ویرایش پرداخت',                   group: 'مالی' },
  { key: 'payments.delete',              label_fa: 'حذف پرداخت',                      group: 'مالی' },
  // ── پلن‌ها ────────────────────────────────────────────────────────────────
  { key: 'plans.view',                    label_fa: 'مشاهده پلن‌ها',                  group: 'پلن‌ها' },
  { key: 'plans.create',                  label_fa: 'ایجاد پلن',                      group: 'پلن‌ها' },
  { key: 'plans.edit',                    label_fa: 'ویرایش پلن‌ها',                  group: 'پلن‌ها' },
  { key: 'plans.delete',                  label_fa: 'حذف پلن',                        group: 'پلن‌ها' },
  // ── گزارشات ──────────────────────────────────────────────────────────────
  { key: 'reports.view',                  label_fa: 'مشاهده گزارشات',                 group: 'گزارشات' },
  { key: 'reports.export',                label_fa: 'خروجی گزارشات',                  group: 'گزارشات' },
  // ── داشبورد ──────────────────────────────────────────────────────────────
  { key: 'dashboard.view',                label_fa: 'مشاهده داشبورد',                 group: 'داشبورد' },
  { key: 'dashboard.stats',               label_fa: 'آمار و نمودار داشبورد',           group: 'داشبورد' },
  // ── تنظیمات ──────────────────────────────────────────────────────────────
  { key: 'settings.view',                 label_fa: 'مشاهده تنظیمات',                 group: 'تنظیمات' },
  { key: 'settings.edit',                 label_fa: 'ویرایش تنظیمات و نقش‌ها',        group: 'تنظیمات' },
  { key: 'role.manage_system',            label_fa: 'مدیریت نقش‌های سیستمی',          group: 'تنظیمات' },
];
