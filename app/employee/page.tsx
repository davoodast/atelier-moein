'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, FileText, Clock, LayoutDashboard, CalendarDays, CheckSquare, Square, X, Plus, RefreshCw, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import JalaliCalendar, { type CeremonyEvent } from '@/components/ui/JalaliCalendar';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { toJalaali } from 'jalaali-js';

interface MyTask {
  ceremony_id: number;
  date_jalali: string | null;
  type: string;
  groom_name: string | null;
  bride_name: string | null;
  time: string;
  address: string;
  status: string;
  role_description: string;
  attendance_hours: number;
}

interface DailyTodo {
  id: number; title: string; is_done: boolean; date_jalali: string;
}

interface RecurringTask {
  id: number; title: string; description: string | null; interval: string;
  day_of_week: number | null; day_of_month: number | null;
  log?: { id: number; is_done: boolean; delete_requested: boolean; admin_approved: number | null };
}

interface TaskLog {
  id: number; title: string; date_jalali: string; is_done: boolean;
  recurring_task_id: number | null; delete_requested: boolean;
  delete_reason: string | null; admin_approved: number | null; note: string | null;
}

function todayJalali() {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

const INTERVAL_LABELS: Record<string, string> = { daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه' };
const DAYS_FA = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'todos' | 'calendar'>('overview');
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CeremonyEvent[] } | null>(null);

  // Todos tab state
  const today = todayJalali();
  const [dailyTodos, setDailyTodos] = useState<DailyTodo[]>([]);
  const [recurring, setRecurring] = useState<RecurringTask[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [deleteReqId, setDeleteReqId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [todosLoading, setTodosLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/ceremonies/my-tasks/list').then(r => setTasks(r.data)).catch(() => {});
  }, []);

  const fetchTodos = useCallback(async () => {
    setTodosLoading(true);
    try {
      const [todosR, logsR] = await Promise.all([
        apiClient.get('/employees/me/todos'),
        apiClient.get('/employees/me/task-log').catch(() => ({ data: [] })),
      ]);
      setDailyTodos(todosR.data.todos || []);
      setRecurring(todosR.data.recurring || []);
      setTaskLogs(Array.isArray(logsR.data) ? logsR.data : []);
    } catch { /* ignore */ } finally { setTodosLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'todos') fetchTodos();
  }, [activeTab, fetchTodos]);

  const addTodo = async () => {
    if (!newTodoTitle.trim()) return;
    try {
      await apiClient.post('/employees/me/todos', { title: newTodoTitle.trim() });
      setNewTodoTitle('');
      fetchTodos();
    } catch { toast.error('خطا در افزودن وظیفه'); }
  };

  const toggleTodo = async (todo: DailyTodo) => {
    try {
      await apiClient.patch('/employees/me/todos', { todo_id: todo.id, is_done: !todo.is_done });
      fetchTodos();
    } catch { toast.error('خطا در بروزرسانی'); }
  };

  const deleteTodo = async (todoId: number) => {
    try {
      await apiClient.delete(`/employees/me/todos?todo_id=${todoId}`);
      fetchTodos();
    } catch { toast.error('خطا در حذف'); }
  };

  const markRecurringDone = async (taskId: number, isDone: boolean) => {
    try {
      await apiClient.put('/employees/me/task-log', { recurring_task_id: taskId, is_done: isDone });
      fetchTodos();
      toast.success(isDone ? 'انجام شد!' : 'علامت‌گذاری حذف شد');
    } catch { toast.error('خطا در بروزرسانی'); }
  };

  const requestDelete = async (logId: number) => {
    if (!deleteReason.trim()) { toast.error('لطفاً دلیل حذف را وارد کنید'); return; }
    try {
      await apiClient.post('/employees/me/task-log', { log_id: logId, reason: deleteReason });
      setDeleteReqId(null);
      setDeleteReason('');
      fetchTodos();
      toast.success('درخواست حذف ارسال شد');
    } catch { toast.error('خطا در ارسال درخواست'); }
  };

  const upcoming = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const done = tasks.filter(t => t.status === 'completed');
  const totalHours = tasks.reduce((s, t) => s + (t.attendance_hours || 0), 0);

  const calEvents: CeremonyEvent[] = tasks.filter(t => t.date_jalali).map(t => ({
    id: t.ceremony_id, date_jalali: t.date_jalali!, groom_name: t.groom_name, bride_name: t.bride_name,
    type: t.type, time: t.time, address: t.address, status: t.status,
  }));

  const doneCount = dailyTodos.filter(t => t.is_done).length;
  const totalTodos = dailyTodos.length;
  const pct = totalTodos > 0 ? Math.round((doneCount / totalTodos) * 100) : 0;

  const doneLogs = taskLogs.filter(l => l.is_done).length;
  const missedLogs = taskLogs.filter(l => !l.is_done && !l.delete_requested).length;
  const points = doneLogs - missedLogs;

  const TABS = [
    { k: 'overview', l: 'خلاصه', icon: LayoutDashboard },
    { k: 'todos', l: 'وظایف امروز', icon: CheckSquare },
    { k: 'calendar', l: 'تقویم', icon: CalendarDays },
  ] as const;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-8 flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map(t => {
            const TabIcon = t.icon;
            return (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.k ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <TabIcon className="w-4 h-4" />
                {t.l}
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-5 sm:space-y-8">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">سلام {user?.username}!</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">برنامه کاری شما</p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-5 shadow-sm text-center sm:text-right">
                  <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500 mb-1.5 sm:mb-3 mx-auto sm:mx-0" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">پیش‌رو</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{upcoming.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-5 shadow-sm text-center sm:text-right">
                  <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-green-500 mb-1.5 sm:mb-3 mx-auto sm:mx-0" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">تکمیل شده</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{done.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-5 shadow-sm text-center sm:text-right">
                  <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-purple-500 mb-1.5 sm:mb-3 mx-auto sm:mx-0" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">کل ساعات</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totalHours}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">وظایف من</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tasks.length === 0 && (
                    <p className="text-center text-gray-400 py-8">هیچ وظیفه‌ای تخصیص نیافته</p>
                  )}
                  {tasks.map((t, i) => (
                    <div key={i} className="p-4 flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${t.status === 'completed' ? 'bg-green-500' : t.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium dark:text-white">{t.type} — {t.groom_name ?? '—'} و {t.bride_name ?? '—'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.date_jalali} | ⏰ {t.time}</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">نقش: {t.role_description}</p>
                        {t.attendance_hours > 0 && <p className="text-xs text-gray-400 mt-1">⌚ {t.attendance_hours} ساعت</p>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                        {t.status === 'completed' ? 'تکمیل' : t.status === 'in_progress' ? 'جاری' : 'رزرو'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'todos' && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">وظایف امروز</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{today}</p>
                </div>
                {/* Points badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${points >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {points >= 0 ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                  {points > 0 ? '+' : ''}{points} امتیاز
                </div>
              </div>

              {/* Daily todos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">وظایف روزانه</h3>
                  <span className="text-[11px] text-gray-400">{doneCount}/{totalTodos}</span>
                </div>
                {totalTodos > 0 && (
                  <div className="px-4 py-2">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {dailyTodos.length === 0 && !todosLoading && (
                    <p className="text-center text-gray-400 text-sm py-6">وظیفه‌ای برای امروز ثبت نشده</p>
                  )}
                  {dailyTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 px-4 py-3 group">
                      <button onClick={() => toggleTodo(todo)}>
                        {todo.is_done ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-gray-300" />}
                      </button>
                      <span className={`flex-1 text-sm ${todo.is_done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{todo.title}</span>
                      <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-3 flex gap-2 border-t border-gray-100 dark:border-gray-700">
                  <input
                    value={newTodoTitle}
                    onChange={e => setNewTodoTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="وظیفه جدید..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <button onClick={addTodo} disabled={!newTodoTitle.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recurring tasks */}
              {recurring.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">وظایف دوره‌ای امروز</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {recurring.map(task => {
                      const log = task.log;
                      const isDone = log?.is_done ?? false;
                      const isPendingDelete = log?.delete_requested && log?.admin_approved == null;
                      return (
                        <div key={task.id} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => !isPendingDelete && markRecurringDone(task.id, !isDone)} disabled={isPendingDelete}>
                              {isDone ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-gray-300" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{task.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {INTERVAL_LABELS[task.interval]}
                                {task.interval === 'weekly' && task.day_of_week != null ? ` — ${DAYS_FA[task.day_of_week]}` : ''}
                              </p>
                            </div>
                            {isPendingDelete && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />درخواست حذف
                              </span>
                            )}
                            {!isPendingDelete && log && (
                              <button
                                onClick={() => { setDeleteReqId(log.id); setDeleteReason(''); }}
                                className="text-[10px] text-red-400 hover:underline"
                              >
                                درخواست حذف
                              </button>
                            )}
                          </div>
                          {deleteReqId === log?.id && (
                            <div className="mt-2 mr-8 flex gap-2">
                              <input
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                placeholder="دلیل حذف..."
                                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                              />
                              <button onClick={() => requestDelete(log!.id)}
                                className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">ارسال</button>
                              <button onClick={() => setDeleteReqId(null)}
                                className="px-2.5 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-xs">لغو</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task log / history */}
              {taskLogs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">تاریخچه وظایف</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-64 overflow-y-auto">
                    {taskLogs.slice(0, 30).map(log => (
                      <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.is_done ? 'bg-green-500' : log.delete_requested ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{log.title}</p>
                          <p className="text-[10px] text-gray-400">{log.date_jalali}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${log.is_done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : log.delete_requested ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                          {log.is_done ? '+1' : log.delete_requested ? 'در انتظار' : '-1'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">تقویم کاری من</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <JalaliCalendar events={calEvents} employeeView onDayClick={(d, evts) => setSelectedDay({ date: d, events: evts })} />
                </div>
                <div>
                  {selectedDay ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-3">
                      <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">مراسم {selectedDay.date}</h3>
                      {selectedDay.events.map(e => {
                        const myTask = tasks.find(t => t.ceremony_id === e.id);
                        return (
                          <div key={e.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-1">
                            <p className="font-medium dark:text-white">{e.type} — {e.groom_name ?? '—'} و {e.bride_name ?? '—'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">⏰ {e.time}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">📍 {e.address}</p>
                            {myTask && <p className="text-sm text-purple-600 dark:text-purple-400">نقش: {myTask.role_description}</p>}
                            {myTask && myTask.attendance_hours > 0 && <p className="text-xs text-gray-400">⌚ {myTask.attendance_hours} ساعت</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex items-center justify-center h-48">
                      <p className="text-gray-400 text-sm text-center">روی روز رنگی کلیک کنید</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}