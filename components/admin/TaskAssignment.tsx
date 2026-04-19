'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, UserCheck, Users, Briefcase } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { formatAmountFa } from '@/utils/numberToWords';
import { toast } from 'sonner';

interface Employee { id: number; user_id: number; position: string | null; username: string; phone: string | null; }
interface Task { id: number; employee_id: number; role_description: string | null; attendance_hours: number | null; username: string; position: string | null; }

interface UserOption { id: number; username: string; email: string | null; phone: string | null; }
interface RoleOption { id: number; name: string; description: string | null; }
interface Assignment {
  id: number;
  userId: number;
  roleId: number;
  baseFee: number | null;
  status: string;
  assignedAt: string;
  user: UserOption;
  role: RoleOption;
}

interface Props { ceremonyId: number; ceremonyLabel: string; onClose: () => void; }

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';

function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export default function TaskAssignment({ ceremonyId, ceremonyLabel, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'assignments'>('assignments');

  // ── Tasks tab state ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({ employee_id: '', role_description: '', attendance_hours: '' });
  const [savingTask, setSavingTask] = useState(false);

  // ── Assignments tab state ──
  const [users, setUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignForm, setAssignForm] = useState({ userId: '', roleId: '', baseFee: '' });
  const [savingAssign, setSavingAssign] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/employees'),
      apiClient.get(`/ceremonies/${ceremonyId}`),
      apiClient.get('/settings/roles'),
    ]).then(([empRes, cerRes, rolesRes]) => {
      setEmployees(empRes.data);
      setTasks(cerRes.data.tasks || []);
      setAssignments(cerRes.data.assignments || []);
      setRoles(rolesRes.data);
      // extract users from employees for assignment
      setUsers(empRes.data.map((e: Employee) => ({ id: e.user_id, username: e.username, email: null, phone: e.phone })));
    }).finally(() => setLoading(false));
  }, [ceremonyId]);

  // ── Task handlers ──
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
      toast.success('کارمند اضافه شد');
    } catch { toast.error('خطا در افزودن کارمند'); }
    finally { setSavingTask(false); }
  }

  async function removeTask(taskId: number) {
    try {
      await apiClient.delete(`/ceremonies/${ceremonyId}/tasks/${taskId}`);
      setTasks((t) => t.filter((x) => x.id !== taskId));
      toast.success('حذف شد');
    } catch { toast.error('خطا در حذف'); }
  }

  // ── Assignment handlers ──
  async function addAssignment() {
    if (!assignForm.userId || !assignForm.roleId) return;
    setSavingAssign(true);
    try {
      const res = await apiClient.post(`/ceremonies/${ceremonyId}/assignments`, {
        userId: parseInt(assignForm.userId),
        roleId: parseInt(assignForm.roleId),
        baseFee: assignForm.baseFee ? parseFloat(toEnDigits(assignForm.baseFee).replace(/[^0-9.]/g, '')) : null,
      });
      setAssignments((a) => [...a, res.data]);
      setAssignForm({ userId: '', roleId: '', baseFee: '' });
      toast.success('تخصیص نقش انجام شد');
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

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  const statusLabel: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', cancelled: 'لغو' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold dark:text-white">تخصیص پرسنل</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{ceremonyLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'assignments' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <Briefcase className="w-4 h-4" />تخصیص نقش
            {assignments.length > 0 && <span className="bg-purple-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{assignments.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'tasks' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <Users className="w-4 h-4" />وظایف
            {tasks.length > 0 && <span className="bg-gray-400 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{tasks.length}</span>}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading ? (
            <div className="text-center py-10 text-gray-400">در حال بارگذاری...</div>
          ) : (
            <>
              {/* ── Assignments Tab ── */}
              {activeTab === 'assignments' && (
                <>
                  {assignments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">نقش‌های تخصیص داده‌شده</h3>
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
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>{statusLabel[a.status] ?? a.status}</span>
                              <button onClick={() => removeAssignment(a.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">افزودن تخصیص نقش</h3>
                    <div className="space-y-3">
                      <select value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))} className={INPUT}>
                        <option value="">انتخاب کاربر...</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                      <select value={assignForm.roleId} onChange={(e) => setAssignForm((f) => ({ ...f, roleId: e.target.value }))} className={INPUT}>
                        <option value="">انتخاب نقش...</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ''}</option>)}
                      </select>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">دستمزد پایه (تومان) — اختیاری</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="مثال: ۵۰۰،۰۰۰"
                          value={assignForm.baseFee}
                          onChange={(e) => setAssignForm((f) => ({ ...f, baseFee: e.target.value }))}
                          className={INPUT}
                        />
                      </div>
                      <button
                        onClick={addAssignment}
                        disabled={savingAssign || !assignForm.userId || !assignForm.roleId}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        {savingAssign ? 'در حال ذخیره...' : 'تخصیص نقش'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Tasks Tab ── */}
              {activeTab === 'tasks' && (
                <>
                  {tasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">کارمندان تخصیص داده شده</h3>
                      <div className="space-y-2">
                        {tasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <UserCheck className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="text-sm font-medium dark:text-white">{t.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t.role_description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {(t.attendance_hours ?? 0) > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{t.attendance_hours} ساعت</span>}
                              <button onClick={() => removeTask(t.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">افزودن کارمند</h3>
                    <div className="space-y-3">
                      <select value={taskForm.employee_id} onChange={(e) => setTaskForm((f) => ({ ...f, employee_id: e.target.value }))} className={INPUT}>
                        <option value="">انتخاب کارمند...</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.username} — {e.position}</option>)}
                      </select>
                      <input type="text" placeholder="شرح وظیفه (مثلاً: عکاسی اصلی)" value={taskForm.role_description}
                        onChange={(e) => setTaskForm((f) => ({ ...f, role_description: e.target.value }))}
                        className={INPUT} />
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ساعت حضور</label>
                        <input type="time" value={taskForm.attendance_hours}
                          onChange={(e) => setTaskForm((f) => ({ ...f, attendance_hours: e.target.value }))}
                          className={INPUT} />
                      </div>
                      <button onClick={addTask} disabled={savingTask || !taskForm.employee_id || !taskForm.role_description}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        {savingTask ? 'در حال ذخیره...' : 'افزودن به مراسم'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


interface Employee { id: number; user_id: number; position: string | null; username: string; phone: string | null; }
interface Task { id: number; employee_id: number; role_description: string | null; attendance_hours: number | null; username: string; position: string | null; }
interface Props { ceremonyId: number; ceremonyLabel: string; onClose: () => void; }

export default function TaskAssignment({ ceremonyId, ceremonyLabel, onClose }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ employee_id: '', role_description: '', attendance_hours: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/employees'),
      apiClient.get(`/ceremonies/${ceremonyId}`),
    ]).then(([empRes, cerRes]) => {
      setEmployees(empRes.data);
      setTasks(cerRes.data.tasks || []);
    }).finally(() => setLoading(false));
  }, [ceremonyId]);

  async function addTask() {
    if (!form.employee_id || !form.role_description) return;
    setSaving(true);
    try {
      await apiClient.post(`/ceremonies/${ceremonyId}/tasks`, {
        employee_id: parseInt(form.employee_id),
        role_description: form.role_description,
        attendance_hours: form.attendance_hours
          ? (() => { const [h, m] = form.attendance_hours.split(':').map(Number); return h + (m || 0) / 60; })()
          : 0,
      });
      const res = await apiClient.get(`/ceremonies/${ceremonyId}`);
      setTasks(res.data.tasks || []);
      setForm({ employee_id: '', role_description: '', attendance_hours: '' });
    } finally { setSaving(false); }
  }

  async function removeTask(taskId: number) {
    await apiClient.delete(`/ceremonies/${ceremonyId}/tasks/${taskId}`);
    setTasks((t) => t.filter((x) => x.id !== taskId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold dark:text-white">تخصیص کارمندان</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{ceremonyLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div>
          ) : (
            <>
              {tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">کارمندان تخصیص داده شده</h3>
                  <div className="space-y-2">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium dark:text-white">{t.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.role_description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {(t.attendance_hours ?? 0) > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{t.attendance_hours} ساعت</span>}
                          <button onClick={() => removeTask(t.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">افزودن کارمند</h3>
                <div className="space-y-3">
                  <select value={form.employee_id} onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                    <option value="">انتخاب کارمند...</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.username} — {e.position}</option>)}
                  </select>
                  <input type="text" placeholder="شرح وظیفه (مثلاً: عکاسی اصلی)" value={form.role_description}
                    onChange={(e) => setForm((f) => ({ ...f, role_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ساعت حضور (فرمت ۲۴ ساعته)</label>
                    <input
                      type="time"
                      value={form.attendance_hours}
                      onChange={(e) => setForm((f) => ({ ...f, attendance_hours: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">ساعت شروع حضور کارمند را انتخاب کنید</p>
                  </div>
                  <button onClick={addTask} disabled={saving || !form.employee_id || !form.role_description}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    {saving ? 'در حال ذخیره...' : 'افزودن به مراسم'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
