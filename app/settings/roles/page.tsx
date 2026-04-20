'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import AccessDeniedModal from '@/components/ui/AccessDeniedModal';
import { usePermission } from '@/lib/usePermission';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  KeyRound,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  id: number;
  key: string;
  label_fa: string;
  group: string;
  description: string | null;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Permission[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

// ─── Role Form Modal ──────────────────────────────────────────────────────────

interface RoleModalProps {
  initial?: Role | null;
  onClose: () => void;
  onSave: () => void;
  isAdmin?: boolean;
}

function RoleModal({ initial, onClose, onSave, isAdmin = false }: RoleModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isSystem, setIsSystem] = useState(initial?.isSystem ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const url = initial
        ? `/api/settings/roles/${initial.id}`
        : '/api/settings/roles';
      const method = initial ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { name: name.trim(), description: description.trim() || null };
      if (!initial) body.isSystem = isSystem;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      toast.success(initial ? 'نقش ویرایش شد' : 'نقش جدید ایجاد شد');
      onSave();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const INPUT =
    'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';
  const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {initial ? 'ویرایش نقش' : 'نقش جدید'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>نام نقش *</label>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: accountant"
              disabled={(initial?.isSystem ?? false) && !isAdmin}
              required
            />
            {initial?.isSystem && !isAdmin && (
              <p className="text-xs text-amber-600 mt-1">نقش‌های پایه سیستم قابل تغییر نام نیستند</p>
            )}
            {initial?.isSystem && isAdmin && (
              <p className="text-xs text-blue-500 mt-1">این یک نقش سیستمی است — با احتیاط ویرایش کنید</p>
            )}
          </div>
          <div>
            <label className={LABEL}>توضیحات</label>
            <textarea
              className={INPUT}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح مختصری درباره این نقش..."
            />
          </div>
          {isAdmin && !initial && (
            <div className="flex items-center gap-2">
              <input
                id="isSystem-check"
                type="checkbox"
                checked={isSystem}
                onChange={(e) => setIsSystem(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-600"
              />
              <label htmlFor="isSystem-check" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                نقش سیستمی
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'ذخیره تغییرات' : 'ایجاد نقش'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  role: Role;
  onClose: () => void;
  onDelete: () => void;
}

function DeleteConfirm({ role, onClose, onDelete }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/roles/${role.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در حذف');
      toast.success('نقش حذف شد');
      onDelete();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">حذف نقش</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          آیا از حذف نقش <strong className="text-gray-900 dark:text-white">«{role.name}»</strong> مطمئنید؟
          این عمل قابل بازگشت نیست.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

interface RolesTabProps {
  roles: Role[];
  onRefresh: () => void;
  isAdmin?: boolean;
}

function RolesTab({ roles, onRefresh, isAdmin = false }: RolesTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const { check, AccessDenied } = usePermission();

  const handleEditClick = (role: Role) => {
    if (role.isSystem && !isAdmin) {
      check(
        ['role.manage_system'],
        'ویرایش نقش‌های سیستمی فقط توسط مدیران سیستم انجام می‌شود.'
      );
      return;
    }
    setEditRole(role);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{roles.length} نقش تعریف شده</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          نقش جدید
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-right">
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">نام نقش</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">توضیحات</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center">کاربران</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center">مجوزها</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {roles.map((role) => (
              <tr
                key={role.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
                    {role.isSystem && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                        سیستمی
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {role.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {role.userCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium px-2">
                    {role.permissions.length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEditClick(role)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title={role.isSystem && !isAdmin ? 'نقش سیستمی فقط توسط مدیران سیستم قابل ویرایش است' : 'ویرایش'}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (role.isSystem && !isAdmin) {
                          check(['role.manage_system'], 'حذف نقش‌های سیستمی فقط توسط مدیران سیستم مجاز است.');
                          return;
                        }
                        setDeleteRole(role);
                      }}
                      disabled={role.isSystem && role.userCount > 0}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title={role.isSystem && role.userCount > 0 ? `${role.userCount} کاربر دارد — قابل حذف نیست` : 'حذف'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  هیچ نقشی تعریف نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreate || editRole) && (
        <RoleModal
          initial={editRole}
          onClose={() => { setShowCreate(false); setEditRole(null); }}
          onSave={onRefresh}
          isAdmin={isAdmin}
        />
      )}
      {deleteRole && (
        <DeleteConfirm
          role={deleteRole}
          onClose={() => setDeleteRole(null)}
          onDelete={onRefresh}
        />
      )}
      {AccessDenied}
    </div>
  );
}

// ─── Permission Matrix Tab ────────────────────────────────────────────────────

interface MatrixTabProps {
  roles: Role[];
  permissions: Permission[];
  onRefresh: () => void;
  onSeedPermissions: () => void;
  seeding: boolean;
}

function MatrixTab({ roles, permissions, onRefresh, onSeedPermissions, seeding }: MatrixTabProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { check, AccessDenied } = usePermission();

  const grouped = groupBy(permissions, (p) => p.group);

  const isGranted = (role: Role, permId: number) =>
    role.permissions.some((p) => p.id === permId);

  const toggle = async (roleId: number, permissionId: number, enabled: boolean) => {
    if (!check(['settings.edit'], 'برای ویرایش ماتریس مجوزها نیاز به مجوز «ویرایش تنظیمات» دارید.')) return;
    const key = `${roleId}-${permissionId}`;
    setToggling(key);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setToggling(null);
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  if (permissions.length === 0) {
    return (
      <div className="text-center py-16">
        <KeyRound className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 mb-1">هیچ مجوزی تعریف نشده است</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
          برای شروع، مجوزهای پیش‌فرض را بارگذاری کنید
        </p>
        <button
          onClick={onSeedPermissions}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          بارگذاری مجوزهای پیش‌فرض
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {permissions.length} مجوز در {Object.keys(grouped).length} گروه
        </p>
        <button
          onClick={onSeedPermissions}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          افزودن مجوزهای پیش‌فرض
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="text-sm min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-right">
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 min-w-[200px]">
                مجوز
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center whitespace-nowrap"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.entries(grouped).map(([group, perms]) => {
              const collapsed = collapsedGroups.has(group);
              return [
                // Group header row
                <tr
                  key={`group-${group}`}
                  className="bg-purple-50/60 dark:bg-purple-900/10 cursor-pointer"
                  onClick={() => toggleGroup(group)}
                >
                  <td
                    colSpan={roles.length + 1}
                    className="px-4 py-2 font-semibold text-purple-700 dark:text-purple-300 text-xs uppercase tracking-wide"
                  >
                    <span className="flex items-center gap-1.5">
                      {collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      {group}
                      <span className="font-normal text-purple-400">({perms.length})</span>
                    </span>
                  </td>
                </tr>,
                // Permission rows
                ...(!collapsed
                  ? perms.map((perm) => (
                      <tr
                        key={perm.id}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-gray-800 dark:text-gray-200">{perm.label_fa}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                              {perm.key}
                            </p>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const granted = isGranted(role, perm.id);
                          const key = `${role.id}-${perm.id}`;
                          const isLoading = toggling === key;
                          return (
                            <td key={role.id} className="px-4 py-3 text-center">
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500 mx-auto" />
                              ) : (
                                <button
                                  onClick={() => toggle(role.id, perm.id, !granted)}
                                  className={`w-5 h-5 rounded border-2 mx-auto flex items-center justify-center transition ${
                                    granted
                                      ? 'bg-purple-600 border-purple-600'
                                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                  }`}
                                  title={granted ? 'غیرفعال کردن' : 'فعال کردن'}
                                  aria-label={`${granted ? 'غیرفعال' : 'فعال'} کردن ${perm.label_fa} برای ${role.name}`}
                                >
                                  {granted && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  : []),
              ];
            })}
          </tbody>
        </table>
      </div>
      {AccessDenied}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RolesSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'roles' | 'matrix'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/settings/roles'),
        fetch('/api/settings/permissions'),
      ]);

      if (rolesRes.status === 401 || rolesRes.status === 403) {
        setAccessDenied(true);
        return;
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesRes.ok) setRoles(rolesData);
      if (permsRes.ok) setPermissions(permsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, router, fetchData]);

  const seedPermissions = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/settings/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      setPermissions(data);
      toast.success('مجوزهای پیش‌فرض بارگذاری شدند');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSeeding(false);
    }
  };

  // ── Render states ──

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </MainLayout>
    );
  }

  if (accessDenied) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-lg font-semibold text-gray-800 dark:text-white">دسترسی محدود</p>
          <p className="text-sm text-gray-500">شما مجوز مشاهده تنظیمات را ندارید</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            بازگشت
          </button>
        </div>
      </MainLayout>
    );
  }

  const TABS = [
    { key: 'roles' as const, label: 'نقش‌ها', icon: ShieldCheck },
    { key: 'matrix' as const, label: 'ماتریس مجوزها', icon: KeyRound },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-3 transition"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به پنل ادمین
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-500" />
            مدیریت نقش‌ها و مجوزها
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تعریف نقش‌ها و اختصاص مجوزهای دسترسی به هر نقش
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'تعداد نقش‌ها', value: roles.length, icon: ShieldCheck, color: 'purple' },
            { label: 'کل مجوزها', value: permissions.length, icon: KeyRound, color: 'blue' },
            {
              label: 'تخصیص یافته',
              value: roles.reduce((s, r) => s + r.permissions.length, 0),
              icon: ShieldCheck,
              color: 'green',
            },
            {
              label: 'کل کاربران',
              value: roles.reduce((s, r) => s + r.userCount, 0),
              icon: Users,
              color: 'amber',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p
                className={`text-2xl font-bold mt-0.5 ${
                  color === 'purple'
                    ? 'text-purple-600'
                    : color === 'blue'
                    ? 'text-blue-600'
                    : color === 'green'
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${
                  tab === key
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'roles' ? (
              <RolesTab
                roles={roles}
                onRefresh={fetchData}
                isAdmin={user?.role === 'admin' || user?.isSystem === true || (user?.permissions?.includes('role.manage_system') ?? false)}
              />
            ) : (
              <MatrixTab
                roles={roles}
                permissions={permissions}
                onRefresh={fetchData}
                onSeedPermissions={seedPermissions}
                seeding={seeding}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
