'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Users, ListTodo, Briefcase, Plus, Trash2, UserCheck,
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { formatAmountFa } from '@/utils/numberToWords';

interface Ceremony {
  id: number; type: string | null; groom_name: string | null; bride_name: string | null;
  date_jalali: string | null; time: string | null; address: string | null;
  total_amount: number | null; advance_paid: number | null; status: string;
  plan_details: string | null;
}

interface Assignment {
  id: number; userId: number; roleId: number; baseFee: number | null; status: string; assignedAt: string;
  user: { id: number; username: string; email: string | null; phone: string | null };
  role: { id: number; name: string; description: string | null };
}

interface Task {
  id: number; employee_id: number; role_description: string | null;
  attendance_hours: number | null; username: string; position: string | null;
}

interface Employee { id: number; user_id: number; username: string; phone: string | null; position: string | null; }
interface Role { id: number; name: string; description: string | null; }

interface MyPerms {
  permissions: string[];
  role: string | null;
  assignmentId?: number;
  baseFee?: number | null;
}

const INPUT = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';

function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export default function EmployeeCeremonyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ceremonyId = parseInt(params.id as string);

  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myPerms, setMyPerms] = useState<MyPerms>({ permissions: [], role: null });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'assignments' | 'tasks'>('assignments');

  // Assignment form
  const [assignForm, setAssignForm] = useState({ userId: '', roleId: '', baseFee: '' });
  const [savingAssign, setSavingAssign] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({ employee_id: '', role_description: '', attendance_hours: '' });
  const [savingTask, setSavingTask] = useState(false);

  const can = (key: string) =>
    myPerms.permissions.includes('*') || myPerms.permissions.includes(key);

  useEffect(() => {
    if (isNaN(ceremonyId)) { router.push('/employee'); return; }

    Promise.all([
      apiClient.get(`/ceremonies/${ceremonyId}`),
      apiClient.get(`/ceremonies/${ceremonyId}/my-permissions`),
    ]).then(([cerRes, permRes]) => {
      const data = cerRes.data;
      setCeremony(data);
      setAssignments(data.assignments || []);
      setTasks(data.tasks || []);
      setMyPerms(permRes.data);
    }).catch(() => {
      toast.error('دسترسی ندارید یا مراسم یافت نشد');
      router.push('/employee');
    }).finally(() => setLoading(false));
  }, [ceremonyId, router]);

  // Load users & roles only if user has manage permissions
  useEffect(() => {
    if (can('ceremonies.assignments.manage') || can('ceremonies.tasks.manage')) {
      Promise.all([
        apiClient.get('/users').catch(() => ({ data: [] })),
        apiClient.get('/settings/roles').catch(() => ({ data: [] })),
      ]).then(([usersRes, rolesRes]) => {
        // Map users to Employee-compatible shape for the existing form
        setEmployees(usersRes.data.map((u: { id: number; username: string; phone: string | null }) => ({
          id: u.id, user_id: u.id, username: u.username, phone: u.phone, position: null,
        })));
        setRoles(rolesRes.data);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPerms]);

  async function addAssignment() {
    if (!assignForm.userId || !assignForm.roleId) return;
    setSavingAssign(true);
    try {
      const res = await apiClient.post(`/ceremonies/${ceremonyId}/assignments`, {
        userId: parseInt(assignForm.userId),
        roleId: parseInt(assignForm.roleId),
        baseFee: assignForm.baseFee
          ? parseFloat(toEnDigits(assignForm.baseFee).replace(/[^0-9.]/g, ''))
          : null,
      });
      setAssignments((a) => [...a, res.data]);
      setAssignForm({ userId: '', roleId: '', baseFee: '' });
      toast.success('نقش تخصیص داده شد');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'خطا در تخصیص نقش');
    } finally { setSavingAssign(false); }
  }

  async function removeAssignment(aId: number) {
    try {
      await apiClient.delete(`/ceremonies/${ceremonyId}/assignments/${aId}`);
      setAssignments((a) => a.filter((x) => x.id !== aId));
      toast.success('تخصیص حذف شد');
    } catch { toast.error('خطا در حذف'); }
  }

  async function addTask() {
    if (!taskForm.employee_id || !taskForm.role_description) return;
    setSavingTask(true);
    try {
      await apiClient.post(`/ceremonies/${ceremonyId}/tasks`, {
        employee_id: parseInt(taskForm.employee_id),
        role_description: taskForm.role_description,
        attendance_hours: taskForm.attendance_hours
          ? (() => { const [h, m] = taskForm.attendance_hours.split(':').map(Number); return h + (m || 0) / 60; })()
          : 0,
      });
      const res = await apiClient.get(`/ceremonies/${ceremonyId}`);
      setTasks(res.data.tasks || []);
      setTaskForm({ employee_id: '', role_description: '', attendance_hours: '' });
      toast.success('وظیفه اضافه شد');
    } catch { toast.error('خطا در افزودن وظیفه'); }
    finally { setSavingTask(false); }
  }

  async function removeTask(taskId: number) {
    try {
      await apiClient.delete(`/ceremonies/${ceremonyId}/tasks/${taskId}`);
      setTasks((t) => t.filter((x) => x.id !== taskId));
      toast.success('حذف شد');
    } catch { toast.error('خطا در حذف'); }
  }

  const statusLabel: Record<string, string> = {
    booked: 'رزرو شده', in_progress: 'در حال برگزاری', completed: 'تکمیل', cancelled: 'لغو شده',
  };
  const statusColor: Record<string, string> = {
    booked: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">در حال بارگذاری...</div>
        </div>
      </MainLayout>
    );
  }

  if (!ceremony) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
        {/* Back + header */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/employee')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white mb-3">
            <ArrowRight className="w-4 h-4" />
            بازگشت به پنل
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {ceremony.type} — {ceremony.groom_name ?? '—'} و {ceremony.bride_name ?? '—'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {ceremony.date_jalali} {ceremony.time ? `| ⏰ ${ceremony.time}` : ''} {ceremony.address ? `| 📍 ${ceremony.address}` : ''}
              </p>
              {myPerms.role && (
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  نقش شما: <span className="font-medium">{myPerms.role}</span>
                  {myPerms.baseFee != null && myPerms.baseFee > 0 && (
                    <span className="mr-2 text-green-600 dark:text-green-400">| دستمزد: {formatAmountFa(myPerms.baseFee)} تومان</span>
                  )}
                </p>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColor[ceremony.status] ?? ''}`}>
              {statusLabel[ceremony.status] ?? ceremony.status}
            </span>
          </div>
        </div>

        {/* Financials row - only if admin or has relevant perm */}
        {(can('*') || can('payments.view') || can('ceremonies.payments.manage')) && ceremony.total_amount != null && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">مبلغ کل</p>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{formatAmountFa(ceremony.total_amount)} ت</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">پیش‌پرداخت</p>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{formatAmountFa(ceremony.advance_paid ?? 0)} ت</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">مانده</p>
              <p className="font-bold text-red-600 dark:text-red-400 mt-1">
                {formatAmountFa((ceremony.total_amount ?? 0) - (ceremony.advance_paid ?? 0))} ت
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'assignments' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
              <Briefcase className="w-4 h-4" />
              اعضا ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
              <ListTodo className="w-4 h-4" />
              وظایف ({tasks.length})
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">

            {/* ── Assignments tab ── */}
            {activeTab === 'assignments' && (
              <>
                {assignments.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">هنوز عضوی تخصیص نیافته</p>
                )}
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium dark:text-white truncate">{a.user.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{a.role.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.baseFee != null && a.baseFee > 0 && (
                          <span className="text-xs text-purple-600 dark:text-purple-400">{formatAmountFa(a.baseFee)} ت</span>
                        )}
                        {can('ceremonies.assignments.manage') && (
                          <button onClick={() => removeAssignment(a.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {can('ceremonies.assignments.manage') && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> افزودن عضو جدید
                    </h3>
                    <select value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))} className={INPUT}>
                      <option value="">انتخاب کاربر...</option>
                      {employees.map((emp) => (
                        <option key={emp.user_id} value={emp.user_id}>{emp.username}</option>
                      ))}
                    </select>
                    <select value={assignForm.roleId} onChange={(e) => setAssignForm((f) => ({ ...f, roleId: e.target.value }))} className={INPUT}>
                      <option value="">انتخاب نقش...</option>
                      {roles.filter((r) => !(r as { isSystem?: boolean }).isSystem).map((r) => <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ''}</option>)}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="دستمزد پایه (اختیاری)"
                      value={assignForm.baseFee}
                      onChange={(e) => setAssignForm((f) => ({ ...f, baseFee: e.target.value }))}
                      className={INPUT}
                    />
                    <button
                      onClick={addAssignment}
                      disabled={savingAssign || !assignForm.userId || !assignForm.roleId}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      {savingAssign ? 'در حال ذخیره...' : 'تخصیص نقش'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Tasks tab ── */}
            {activeTab === 'tasks' && (
              <>
                {tasks.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">وظیفه‌ای ثبت نشده</p>
                )}
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium dark:text-white">{t.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.role_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {(t.attendance_hours ?? 0) > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{t.attendance_hours} ساعت</span>
                        )}
                        {can('ceremonies.tasks.manage') && (
                          <button onClick={() => removeTask(t.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {can('ceremonies.tasks.manage') && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> افزودن وظیفه جدید
                    </h3>
                    <select value={taskForm.employee_id} onChange={(e) => setTaskForm((f) => ({ ...f, employee_id: e.target.value }))} className={INPUT}>
                      <option value="">انتخاب کارمند...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.username}{emp.position ? ` — ${emp.position}` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="شرح وظیفه"
                      value={taskForm.role_description}
                      onChange={(e) => setTaskForm((f) => ({ ...f, role_description: e.target.value }))}
                      className={INPUT}
                    />
                    <input
                      type="text"
                      placeholder="ساعت حضور (مثال: 8 یا 8:30)"
                      value={taskForm.attendance_hours}
                      onChange={(e) => setTaskForm((f) => ({ ...f, attendance_hours: e.target.value }))}
                      className={INPUT}
                    />
                    <button
                      onClick={addTask}
                      disabled={savingTask || !taskForm.employee_id || !taskForm.role_description}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      {savingTask ? 'در حال ذخیره...' : 'افزودن وظیفه'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
