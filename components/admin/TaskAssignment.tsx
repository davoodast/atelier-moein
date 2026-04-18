'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, UserCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';

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
        attendance_hours: parseFloat(form.attendance_hours) || 0,
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
                  <input type="number" placeholder="ساعت حضور (اختیاری)" value={form.attendance_hours}
                    onChange={(e) => setForm((f) => ({ ...f, attendance_hours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
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
