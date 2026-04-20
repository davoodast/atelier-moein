'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase, ListTodo, CreditCard, Wallet, User,
  CheckSquare, Square, Plus, Loader2, ChevronDown,
  CheckCircle2, AlertCircle, ArrowLeft, SendHorizontal, Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { toJalaali } from 'jalaali-js';

// ── Types ────────────────────────────────────────────────────────────────────

interface MyTask {
  source?: 'task' | 'assignment';
  ceremony_id: number;
  date_jalali: string | null;
  type: string | null;
  groom_name: string | null;
  bride_name: string | null;
  time: string | null;
  status: string;
  role_description: string;
  role_name?: string | null;
  base_fee?: number | null;
  canManage?: boolean;
  canCreateTodo?: boolean;
}

interface CeremonyTodo {
  id: number;
  title: string;
  status: 'pending' | 'done' | 'approved' | 'rejected';
  dueAt?: string | null;
  deadlineAt?: string | null;
  canMarkDone?: boolean;
  isOverdue?: boolean;
  priority: number;
  adminNote: string | null;
  penaltyPoints: number;
  ceremony: { id: number; type: string | null; date_jalali: string | null; groom_name: string | null; bride_name: string | null };
  assignment: { role: { name: string } };
}

interface DailyTodo { id: number; title: string; is_done: boolean; date_jalali: string; }

interface Payroll {
  id: number;
  month_year: string | null;
  gross_salary: number | null;
  deductions: number | null;
  total: number | null;
  status: string;
  created_at: string;
}

interface Advance {
  id: number;
  amount: number | null;
  date_jalali: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

interface InboxMessage {
  id: number;
  body: string;
  status: 'unread' | 'read' | 'replied';
  adminReply: string | null;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayJalali() {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

const TODO_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  done:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const TODO_FA: Record<string, string> = {
  pending: 'در انتظار', done: 'انجام شد', approved: 'تایید', rejected: 'رد شد',
};
const CER_STATUS_STYLE: Record<string, string> = {
  booked:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const CER_STATUS_FA: Record<string, string> = {
  booked: 'رزرو', in_progress: 'جاری', completed: 'تکمیل', cancelled: 'لغو',
};
const ADV_STATUS_FA: Record<string, string> = {
  pending: 'در انتظار', approved: 'تایید شد', rejected: 'رد شد',
};

const INPUT = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  type Tab = 'tasks' | 'ceremony-todos' | 'daily-todos' | 'payroll' | 'advances' | 'inbox';
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [expandedCeremony, setExpandedCeremony] = useState<number | null>(null);

  // Ceremony tasks
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Ceremony todos
  const [ceremonyTodos, setCeremonyTodos] = useState<CeremonyTodo[]>([]);
  const [ctLoading, setCtLoading] = useState(false);
  const lastOverdueCountRef = useRef(0);

  // Daily todos
  const [dailyTodos, setDailyTodos] = useState<DailyTodo[]>([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [hasEmployee, setHasEmployee] = useState<boolean | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Payroll
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);

  // Advances
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: '', date_jalali: todayJalali(), reason: '' });
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Inbox
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load ceremony tasks on mount
  useEffect(() => {
    setTasksLoading(true);
    apiClient.get('/ceremonies/my-tasks/list')
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, []);

  const fetchCeremonyTodos = useCallback(async () => {
    setCtLoading(true);
    try {
      const r = await apiClient.get('/ceremonies/my-todos');
      const list = Array.isArray(r.data) ? r.data : [];
      setCeremonyTodos(list);
      const overdue = list.filter((t: CeremonyTodo) => t.isOverdue).length;
      if (overdue > 0 && overdue !== lastOverdueCountRef.current) {
        toast.warning(`${overdue} مسئولیت شما هنوز تیک نخورده و از موعد گذشته است`);
      }
      lastOverdueCountRef.current = overdue;
    }
    catch { } finally { setCtLoading(false); }
  }, []);

  const fetchDailyTodos = useCallback(async () => {
    setTodosLoading(true);
    try {
      const r = await apiClient.get('/employees/me/todos');
      setDailyTodos(r.data.todos || []);
      setHasEmployee(r.data.employee_id !== null);
    } catch { setHasEmployee(false); } finally { setTodosLoading(false); }
  }, []);

  const fetchPayroll = useCallback(async () => {
    setPayrollLoading(true);
    try { const r = await apiClient.get('/employees/me/payroll'); setPayrolls(r.data); }
    catch { } finally { setPayrollLoading(false); }
  }, []);

  const fetchAdvances = useCallback(async () => {
    setAdvancesLoading(true);
    try { const r = await apiClient.get('/employees/me/advances'); setAdvances(r.data); }
    catch { } finally { setAdvancesLoading(false); }
  }, []);

  const fetchMessages = useCallback(async () => {
    setMsgLoading(true);
    try {
      const r = await apiClient.get('/messages');
      setMessages(r.data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ceremony-todos') fetchCeremonyTodos();
    else if (activeTab === 'daily-todos') fetchDailyTodos();
    else if (activeTab === 'payroll') fetchPayroll();
    else if (activeTab === 'advances') fetchAdvances();
    else if (activeTab === 'inbox') fetchMessages();
  }, [activeTab, fetchCeremonyTodos, fetchDailyTodos, fetchPayroll, fetchAdvances, fetchMessages]);

  useEffect(() => {
    fetchCeremonyTodos();
    fetchMessages();
  }, [fetchCeremonyTodos, fetchMessages]);

  const markCeremonyTodoDone = async (todo: CeremonyTodo) => {
    if (todo.status !== 'pending') return;
    if (todo.canMarkDone === false) {
      toast.error('هنوز زمان انجام این مسئولیت نرسیده است');
      return;
    }
    try {
      await apiClient.patch(`/ceremonies/${todo.ceremony.id}/todos/${todo.id}`, { status: 'done' });
      setCeremonyTodos(ts => ts.map(t => t.id === todo.id ? { ...t, status: 'done' as const } : t));
      toast.success('وظیفه انجام شد');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'خطا');
    }
  };

  const addDailyTodo = async () => {
    if (!newTodoTitle.trim()) return;
    try {
      await apiClient.post('/employees/me/todos', { title: newTodoTitle.trim() });
      setNewTodoTitle('');
      fetchDailyTodos();
      toast.success('وظیفه اضافه شد');
    } catch { toast.error('خطا در افزودن'); }
  };

  const toggleDailyTodo = async (todo: DailyTodo) => {
    try {
      await apiClient.patch('/employees/me/todos', { todo_id: todo.id, is_done: !todo.is_done });
      fetchDailyTodos();
    } catch { toast.error('خطا'); }
  };

  const submitAdvance = async () => {
    if (!advanceForm.amount || !advanceForm.reason.trim()) { toast.error('مبلغ و دلیل الزامی است'); return; }
    setSavingAdvance(true);
    try {
      await apiClient.post('/employees/me/advances', advanceForm);
      setShowAdvanceForm(false);
      setAdvanceForm({ amount: '', date_jalali: todayJalali(), reason: '' });
      fetchAdvances();
      toast.success('درخواست ارسال شد');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'خطا در ارسال درخواست');
    } finally { setSavingAdvance(false); }
  };

  const submitMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await apiClient.post('/messages', { body: newMessage.trim() });
      setNewMessage('');
      toast.success('پیام شما ارسال شد');
      fetchMessages();
    } catch {
      toast.error('خطا در ارسال پیام');
    } finally {
      setSendingMessage(false);
    }
  };

  const TABS = [
    { k: 'tasks' as Tab,          l: 'مراسم من',       icon: Briefcase },
    { k: 'ceremony-todos' as Tab, l: 'وظایف مراسم',    icon: ListTodo },
    { k: 'daily-todos' as Tab,    l: 'وظایف من',       icon: CheckSquare },
    { k: 'payroll' as Tab,        l: 'فیش حقوقی',      icon: CreditCard },
    { k: 'advances' as Tab,       l: 'درخواست‌ها',     icon: Wallet },
    { k: 'inbox' as Tab,          l: 'صندوق پیام',     icon: Mail },
  ] as const;

  const overdueCeremonyTodos = ceremonyTodos.filter((t) => t.isOverdue).length;
  const doneDailyTodos = dailyTodos.filter((t) => t.is_done).length;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Hero */}
        <div className="px-3 sm:px-6 pt-4 sm:pt-6">
          <div className="max-w-5xl mx-auto rounded-2xl bg-gradient-to-l from-slate-900 via-indigo-900 to-slate-800 p-4 sm:p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">داشبورد شخصی {user?.username}</h1>
                  <p className="text-xs text-white/75 mt-1">مدیریت وظایف مراسم، وظایف شخصی، مالی و پیام‌ها</p>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'accountant' || user?.isSystem) && (
                <button onClick={() => router.push('/admin')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition">
                  پنل ادمین
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/70">مراسم فعال</p>
                <p className="text-lg font-bold mt-1">{tasks.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/70">وظایف مراسم معوق</p>
                <p className="text-lg font-bold mt-1">{overdueCeremonyTodos}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/70">وظایف من (انجام‌شده)</p>
                <p className="text-lg font-bold mt-1">{doneDailyTodos}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/70">پیام‌های من</p>
                <p className="text-lg font-bold mt-1">{messages.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-3 sm:px-6 mt-3">
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 flex overflow-x-auto scrollbar-hide">
            {TABS.map(t => {
              const TabIcon = t.icon;
              return (
                <button key={t.k} onClick={() => setActiveTab(t.k)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                    activeTab === t.k
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t.l}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-3">

          {/* ── مراسم من ─────────────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">مراسم‌های من ({tasks.length})</h2>
              {tasksLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}
              {!tasksLoading && tasks.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm">
                  هیچ مراسمی به شما اختصاص نیافته
                </div>
              )}
              {tasks.map((t, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedCeremony(expandedCeremony === t.ceremony_id ? null : t.ceremony_id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium dark:text-white text-sm">
                          {t.type} — {t.groom_name ?? '—'} و {t.bride_name ?? '—'}
                        </p>
                        {t.canManage && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">مدیر</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t.date_jalali ?? '—'} | ⏰ {t.time ?? '—'}</span>
                        <span className="text-xs text-purple-600 dark:text-purple-400">{t.role_name ?? t.role_description}</span>
                        {t.base_fee != null && t.base_fee > 0 && (
                          <span className="text-xs text-green-600 dark:text-green-400">{t.base_fee.toLocaleString('fa-IR')} ت</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CER_STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {CER_STATUS_FA[t.status] ?? t.status}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedCeremony === t.ceremony_id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {expandedCeremony === t.ceremony_id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex gap-3">
                      <button
                        onClick={() => router.push(`/employee/ceremony/${t.ceremony_id}`)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:underline dark:text-purple-400">
                        جزئیات و تیم مراسم
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── وظایف مراسم ─────────────────────────────────────────────────── */}
          {activeTab === 'ceremony-todos' && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">وظایف مراسم ({ceremonyTodos.length})</h2>
              {ctLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}
              {!ctLoading && ceremonyTodos.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm">
                  وظیفه‌ای تعریف نشده
                </div>
              )}
              {ceremonyTodos.map(todo => (
                <div key={todo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white text-sm">{todo.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {todo.ceremony.type} — {todo.ceremony.groom_name ?? '—'} | {todo.ceremony.date_jalali ?? '—'}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">نقش: {todo.assignment.role.name}</p>
                      {todo.adminNote && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{todo.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TODO_STYLE[todo.status]}`}>
                        {TODO_FA[todo.status]}
                      </span>
                      {todo.penaltyPoints > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                          -{todo.penaltyPoints} امتیاز
                        </span>
                      )}
                      {todo.status === 'pending' && (
                        <button onClick={() => markCeremonyTodoDone(todo)} disabled={todo.canMarkDone === false}
                          className="flex items-center gap-1 text-[10px] text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
                          <CheckCircle2 className="w-3 h-3" />انجام شد
                        </button>
                      )}
                    </div>
                  </div>
                  {todo.deadlineAt && (
                    <p className={`mt-2 text-[11px] ${todo.isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      موعد انجام: {new Date(todo.deadlineAt).toLocaleString('fa-IR')}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── وظایف روزانه ─────────────────────────────────────────────────── */}
          {activeTab === 'daily-todos' && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">وظایف روزانه</h2>
              {todosLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}
              {!todosLoading && hasEmployee === false && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">پروفایل کارمندی برای شما تنظیم نشده است.</p>
                  <p className="text-gray-400 text-xs mt-1">برای ثبت وظایف روزانه، مدیر باید شما را به عنوان کارمند ثبت کند.</p>
                </div>
              )}
              {!todosLoading && hasEmployee && (
                <>
                  <div className="flex gap-2">
                    <input type="text" value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addDailyTodo()}
                      placeholder="وظیفه جدید..." className={INPUT} />
                    <button onClick={addDailyTodo}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {dailyTodos.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm">
                      وظیفه‌ای برای امروز نیست
                    </div>
                  )}
                  {dailyTodos.map(todo => (
                    <div key={todo.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleDailyTodo(todo)}>
                      {todo.is_done
                        ? <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                      <span className={`flex-1 text-sm dark:text-gray-300 ${todo.is_done ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                        {todo.title}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── فیش حقوقی ─────────────────────────────────────────────────────── */}
          {activeTab === 'payroll' && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">فیش‌های حقوقی</h2>
              {payrollLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}
              {!payrollLoading && payrolls.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
                  فیش حقوقی ثبت نشده
                </div>
              )}
              {payrolls.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold dark:text-white text-sm">{p.month_year ?? '—'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span>حقوق پایه: {(p.gross_salary ?? 0).toLocaleString('fa-IR')} ت</span>
                        {(p.deductions ?? 0) > 0 && (
                          <span className="text-red-500">کسورات: {(p.deductions ?? 0).toLocaleString('fa-IR')} ت</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {(p.total ?? 0).toLocaleString('fa-IR')} ت
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                        {p.status === 'paid' ? 'پرداخت شد' : 'در انتظار'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── درخواست‌ها ────────────────────────────────────────────────────── */}
          {activeTab === 'advances' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  درخواست پیش‌پرداخت ({advances.length})
                </h2>
                <button onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" />درخواست جدید
                </button>
              </div>

              {showAdvanceForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                  <h3 className="font-medium dark:text-white text-sm">درخواست پیش‌پرداخت جدید</h3>
                  <input type="number" placeholder="مبلغ (تومان) *" min={1}
                    value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))}
                    className={INPUT} />
                  <input type="text" placeholder="تاریخ (مثال: ۱۴۰۴/۰۱/۱۵)"
                    value={advanceForm.date_jalali} onChange={e => setAdvanceForm(f => ({ ...f, date_jalali: e.target.value }))}
                    className={INPUT} />
                  <textarea placeholder="دلیل درخواست *" rows={3}
                    value={advanceForm.reason} onChange={e => setAdvanceForm(f => ({ ...f, reason: e.target.value }))}
                    className={INPUT + ' resize-none'} />
                  <div className="flex gap-2">
                    <button onClick={submitAdvance} disabled={savingAdvance}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition">
                      {savingAdvance ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      ارسال درخواست
                    </button>
                    <button onClick={() => setShowAdvanceForm(false)}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition">
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {advancesLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}
              {!advancesLoading && advances.length === 0 && !showAdvanceForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
                  درخواستی ثبت نشده
                </div>
              )}
              {advances.map(a => (
                <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold dark:text-white text-sm">{(a.amount ?? 0).toLocaleString('fa-IR')} تومان</p>
                      {a.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.reason}</p>}
                      {a.date_jalali && <p className="text-xs text-gray-400 mt-0.5">{a.date_jalali}</p>}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${TODO_STYLE[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ADV_STATUS_FA[a.status] ?? a.status}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── صندوق پیام ───────────────────────────────────────────────────── */}
          {activeTab === 'inbox' && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">صندوق پیام</h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">پیام کوتاه خود را برای مدیریت ارسال کنید.</p>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="متن پیام..."
                  className={INPUT + ' resize-none'}
                />
                <button onClick={submitMessage} disabled={sendingMessage || !newMessage.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition">
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                  ارسال پیام
                </button>
              </div>

              {msgLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}

              {!msgLoading && messages.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
                  هنوز پیامی ارسال نشده
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{m.body}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.status === 'replied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : m.status === 'read' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                      {m.status === 'replied' ? 'پاسخ داده شد' : m.status === 'read' ? 'دیده شد' : 'جدید'}
                    </span>
                  </div>
                  {m.adminReply && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <p className="text-[11px] text-green-700 dark:text-green-300 mb-1">پاسخ مدیریت</p>
                      <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{m.adminReply}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">{new Date(m.createdAt).toLocaleString('fa-IR')}</p>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
