'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, CheckSquare, Square, X, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { toJalaali } from 'jalaali-js';

interface Employee {
  id: number; username: string; email: string | null; phone: string | null;
  position: string | null; salary: number | null; status: string;
  start_date: string | null; bank_account: string | null;
  work_description: string | null; work_hours: number | null; attendance_hours: number | null;
}

interface DailyTodo {
  id: number; employee_id: number; date_jalali: string; title: string; is_done: boolean;
}

const F = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

function todayJalali() {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

function TodoProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
        <span>پیشرفت امروز</span>
        <span>{pct}٪ ({done}/{total})</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-purple-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TodoPanel({ employee }: { employee: Employee }) {
  const today = todayJalali();
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTodos(); }, [employee.id]);

  const fetchTodos = async () => {
    try {
      const r = await apiClient.get(`/employees/${employee.id}/todos?date=${today}`);
      setTodos(r.data);
    } catch { /* ignore */ }
  };

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await apiClient.post(`/employees/${employee.id}/todos`, { title: newTitle.trim(), date_jalali: today });
      setNewTitle('');
      fetchTodos();
    } catch { toast.error('خطا در افزودن وظیفه'); } finally { setLoading(false); }
  };

  const toggleTodo = async (todo: DailyTodo) => {
    try {
      await apiClient.patch(`/employees/${employee.id}/todos`, { todo_id: todo.id, is_done: !todo.is_done });
      fetchTodos();
    } catch { toast.error('خطا در بروزرسانی'); }
  };

  const deleteTodo = async (todoId: number) => {
    try {
      await apiClient.delete(`/employees/${employee.id}/todos?todo_id=${todoId}`);
      fetchTodos();
    } catch { toast.error('خطا در حذف وظیفه'); }
  };

  const done = todos.filter(t => t.is_done).length;

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">وظایف امروز ({today})</p>
        <span className="text-[10px] text-gray-400">{done}/{todos.length}</span>
      </div>
      <TodoProgress done={done} total={todos.length} />
      <div className="mt-3 space-y-1.5">
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group">
            <button onClick={() => toggleTodo(todo)} className="flex-shrink-0">
              {todo.is_done
                ? <CheckSquare className="w-4 h-4 text-green-500" />
                : <Square className="w-4 h-4 text-gray-400" />}
            </button>
            <span className={`flex-1 text-xs ${todo.is_done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{todo.title}</span>
            <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ))}
        {todos.length === 0 && <p className="text-[11px] text-gray-400 text-center py-1">وظیفه‌ای برای امروز ثبت نشده</p>}
      </div>
      <div className="flex gap-1.5 mt-3">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="وظیفه جدید..."
          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button onClick={addTodo} disabled={loading || !newTitle.trim()}
          className="px-2.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function EmployeesManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', position: '',
    salary: 0, status: 'active', start_date: '', password: 'password123',
    work_description: '', work_hours: 8, attendance_hours: 0,
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try { const r = await apiClient.get('/employees'); setEmployees(r.data); }
    catch { toast.error('خطا در بارگذاری کارمندان'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { password: _p, ...updateData } = formData;
        await apiClient.put(`/employees/${editingId}`, updateData);
        toast.success('اطلاعات کارمند بروزرسانی شد');
      } else {
        await apiClient.post('/employees', formData);
        toast.success('کارمند جدید اضافه شد');
      }
      fetchEmployees(); setShowForm(false); setEditingId(null); resetForm();
    } catch { toast.error('خطا در ذخیره اطلاعات'); }
  };

  const resetForm = () => setFormData({
    username: '', email: '', phone: '', position: '', salary: 0,
    status: 'active', start_date: '', password: 'password123',
    work_description: '', work_hours: 8, attendance_hours: 0,
  });

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try { await apiClient.delete(`/employees/${id}`); fetchEmployees(); toast.success('کارمند حذف شد'); }
    catch { toast.error('خطا در حذف کارمند'); }
  };

  const handleEdit = (emp: Employee) => {
    setFormData({
      username: emp.username, email: emp.email ?? '', phone: emp.phone ?? '',
      position: emp.position ?? '', salary: emp.salary ?? 0, status: emp.status,
      start_date: emp.start_date ?? '', password: '',
      work_description: emp.work_description ?? '', work_hours: emp.work_hours ?? 8,
      attendance_hours: emp.attendance_hours ?? 0,
    });
    setEditingId(emp.id); setShowForm(true);
  };

  const filteredEmployees = employees.filter((e) =>
    (e.username || '').includes(searchQuery) ||
    (e.email || '').includes(searchQuery) ||
    (e.position || '').includes(searchQuery)
  );

  const set = (k: string, v: string | number) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="text-lg sm:text-2xl font-bold dark:text-white">مدیریت کارمندان</h2>
        <button onClick={() => { setShowForm(!showForm); if (showForm) { setEditingId(null); resetForm(); } }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">افزودن کارمند جدید</span>
          <span className="sm:hidden">کارمند جدید</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="جستجو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">
            {editingId ? 'ویرایش کارمند' : 'افزودن کارمند جدید'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={LABEL}>نام کاربری</label>
                <input type="text" value={formData.username} onChange={e => set('username', e.target.value)} className={F} required disabled={!!editingId} /></div>
              <div><label className={LABEL}>ایمیل</label>
                <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} className={F} /></div>
              <div><label className={LABEL}>شماره تلفن</label>
                <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)} className={F} /></div>
              <div><label className={LABEL}>سمت شغلی</label>
                <input type="text" value={formData.position} onChange={e => set('position', e.target.value)} className={F} placeholder="عکاسی، فیلمبرداری، تدوین..." /></div>
              <div><label className={LABEL}>حقوق ماهانه (تومان)</label>
                <input type="number" value={formData.salary} onChange={e => set('salary', parseInt(e.target.value) || 0)} className={F} min={0} /></div>
              <div><label className={LABEL}>تاریخ شروع</label>
                <input type="text" value={formData.start_date} onChange={e => set('start_date', e.target.value)} className={F} placeholder="1402/01/01" /></div>
              <div><label className={LABEL}>ساعت کار روزانه</label>
                <input type="number" value={formData.work_hours} onChange={e => set('work_hours', parseFloat(e.target.value) || 8)} className={F} min={1} max={24} step={0.5} /></div>
              <div><label className={LABEL}>ساعت حضور (تجمعی)</label>
                <input type="number" value={formData.attendance_hours} onChange={e => set('attendance_hours', parseFloat(e.target.value) || 0)} className={F} min={0} step={0.5} /></div>
              <div>
                <label className={LABEL}>وضعیت</label>
                <div className="relative">
                  <select value={formData.status} onChange={e => set('status', e.target.value)} className={F + ' appearance-none'}>
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {!editingId && (
                <div><label className={LABEL}>رمز عبور</label>
                  <input type="password" value={formData.password} onChange={e => set('password', e.target.value)} className={F} required /></div>
              )}
            </div>
            <div>
              <label className={LABEL}>شرح وظایف</label>
              <textarea value={formData.work_description} onChange={e => set('work_description', e.target.value)}
                className={F + ' min-h-[100px] resize-y'} placeholder="وظایف کلی، مسئولیت‌ها و شرح شغلی..." rows={4} />
              <p className="text-[11px] text-gray-400 mt-1">مسئولیت‌ها و انتظارات کلی از کارمند</p>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                {editingId ? 'بروزرسانی' : 'ذخیره'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {['نام کاربری','سمت','تلفن','حقوق','ساعت کار','ساعت حضور','وضعیت','عملیات'].map((h) => (
                <th key={h} className="px-4 py-3 text-right text-xs font-medium dark:text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">درحال بارگذاری...</td></tr>
              : filteredEmployees.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">هیچ کارمندی یافت نشد</td></tr>
              : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 dark:text-gray-300 font-medium">{emp.username}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{emp.position || '—'}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{emp.phone || '—'}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{(emp.salary ?? 0).toLocaleString('fa-IR')} ت</td>
                  <td className="px-4 py-3 dark:text-gray-300">{emp.work_hours ?? 8}h</td>
                  <td className="px-4 py-3 dark:text-gray-300">{emp.attendance_hours ?? 0}h</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${emp.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {emp.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEdit(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && <p className="text-center text-gray-400 py-6">درحال بارگذاری...</p>}
        {!loading && filteredEmployees.length === 0 && <p className="text-center text-gray-400 py-6">هیچ کارمندی یافت نشد</p>}
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold dark:text-white">{emp.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{emp.position || '—'}</p>
                {emp.phone && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{emp.phone}</p>}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-xs text-gray-600 dark:text-gray-300">{(emp.salary ?? 0).toLocaleString('fa-IR')} ت</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">⏰ {emp.work_hours ?? 8}h</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">✅ {emp.attendance_hours ?? 0}h</p>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {emp.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </span>
                  <button onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                    className="text-xs text-purple-500 hover:underline">
                    {expandedId === emp.id ? 'بستن وظایف' : 'وظایف امروز'}
                  </button>
                </div>
                {expandedId === emp.id && <TodoPanel employee={emp} />}
                {emp.work_description && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">{emp.work_description}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(emp)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Todo Panels */}
      <div className="hidden sm:block space-y-2">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 pt-2">وظایف روزانه کارمندان</h3>
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span>{emp.username} — {emp.position || 'بدون سمت'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === emp.id ? 'rotate-180' : ''}`} />
            </button>
            {expandedId === emp.id && (
              <div className="px-5 pb-4">
                {emp.work_description && (
                  <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">شرح وظایف</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">{emp.work_description}</p>
                  </div>
                )}
                <TodoPanel employee={emp} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
