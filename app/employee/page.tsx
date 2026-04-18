'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, Clock, LayoutDashboard, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import JalaliCalendar, { type CeremonyEvent } from '@/components/ui/JalaliCalendar';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';

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

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview');
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CeremonyEvent[] } | null>(null);

  useEffect(() => {
    apiClient.get('/ceremonies/my-tasks/list').then(r => setTasks(r.data)).catch(() => {});
  }, []);

  const upcoming = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const done = tasks.filter(t => t.status === 'completed');
  const totalHours = tasks.reduce((s, t) => s + (t.attendance_hours || 0), 0);

  const calEvents: CeremonyEvent[] = tasks.filter(t => t.date_jalali).map(t => ({
    id: t.ceremony_id, date_jalali: t.date_jalali!, groom_name: t.groom_name, bride_name: t.bride_name,
    type: t.type, time: t.time, address: t.address, status: t.status,
  }));

  const TABS = [
    { k: 'overview', l: 'خلاصه', icon: LayoutDashboard },
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
