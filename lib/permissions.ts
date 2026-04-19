import { prisma } from '@/lib/prisma';
import type { JWTPayload } from '@/lib/auth';

/**
 * Check if a user (by role name) has a specific permission key.
 * Admin role always passes all permission checks (bootstrap safety).
 */
export async function hasPermission(
  authUser: JWTPayload | null,
  key: string
): Promise<boolean> {
  if (!authUser) return false;
  if (authUser.role === 'admin') return true;

  const role = await prisma.role.findUnique({
    where: { name: authUser.role },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });

  return role?.rolePermissions.some((rp) => rp.permission.key === key) ?? false;
}

/** Default permissions to seed on first use */
export const DEFAULT_PERMISSIONS = [
  { key: 'ceremonies.view',    label_fa: 'مشاهده مراسم',        group: 'مراسم' },
  { key: 'ceremonies.create',  label_fa: 'ایجاد مراسم',          group: 'مراسم' },
  { key: 'ceremonies.edit',    label_fa: 'ویرایش مراسم',         group: 'مراسم' },
  { key: 'ceremonies.delete',  label_fa: 'حذف مراسم',            group: 'مراسم' },
  { key: 'employees.view',     label_fa: 'مشاهده پرسنل',         group: 'پرسنل' },
  { key: 'employees.create',   label_fa: 'ایجاد پرسنل',          group: 'پرسنل' },
  { key: 'employees.edit',     label_fa: 'ویرایش پرسنل',         group: 'پرسنل' },
  { key: 'employees.delete',   label_fa: 'حذف پرسنل',            group: 'پرسنل' },
  { key: 'payments.view',      label_fa: 'مشاهده پرداخت‌ها',     group: 'مالی' },
  { key: 'payments.create',    label_fa: 'ثبت پرداخت',           group: 'مالی' },
  { key: 'plans.view',         label_fa: 'مشاهده پلن‌ها',        group: 'پلن‌ها' },
  { key: 'plans.edit',         label_fa: 'ویرایش پلن‌ها',        group: 'پلن‌ها' },
  { key: 'reports.view',       label_fa: 'مشاهده گزارشات',       group: 'گزارشات' },
  { key: 'settings.view',      label_fa: 'مشاهده تنظیمات',       group: 'تنظیمات' },
  { key: 'settings.edit',      label_fa: 'ویرایش تنظیمات و نقش‌ها', group: 'تنظیمات' },
];
