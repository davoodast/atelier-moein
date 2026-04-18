'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, CreditCard, TrendingUp, LayoutDashboard, Users, CalendarDays, Package } from 'lucide-react';
import CeremoniesManagement from '@/components/admin/CeremoniesManagement';
import EmployeesManagement from '@/components/admin/EmployeesManagement';
import PlansManagement from '@/components/admin/PlansManagement';
import JalaliCalendar, { type CeremonyEvent } from '@/components/ui/JalaliCalendar';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';
import { formatAmountFa } from '@/utils/numberToWords';

interface Ceremony {
  id: number; type: string; groom_name: string | null; bride_name: string | null;
  date_jalali: string | null; time: string; address: string;
  total_amount: number | null; advance_paid: number | null; status: string;
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t transition-all duration-700" style={{ height: `${(d.value / max) * 80}px`, background: d.color, minHeight: 4 }} />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ceremonies' | 'employees' | 'calendar' | 'plans'>('dashboard');
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CeremonyEvent[] } | null>(null);

  useEffect(() => { apiClient.get('/ceremonies').then(r => setCeremonies(r.data)).catch(() => {}); }, []);

  const totalRevenue = ceremonies.reduce((s, c) => s + (c.total_amount || 0), 0);
  const totalAdvance = ceremonies.reduce((s, c) => s + (c.advance_paid || 0), 0);
  const booked = ceremonies.filter(c => c.status === 'booked' || c.status === 'in_progress').length;
  const completed = ceremonies.filter(c => c.status === 'completed').length;

  const stats = [
    { title: 'کل قراردادها', value: `${formatAmountFa(totalRevenue)} ت`, icon: CreditCard, color: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400' },
    { title: 'پیش‌پرداخت', value: `${formatAmountFa(totalAdvance)} ت`, icon: TrendingUp, color: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600 dark:text-blue-400' },
    { title: 'رزرو شده', value: `${booked} مراسم`, icon: Calendar, color: 'bg-purple-100 dark:bg-purple-900/30', tc: 'text-purple-600 dark:text-purple-400' },
    { title: 'انجام شده', value: `${completed} مراسم`, icon: BarChart3, color: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400' },
  ];

  const typeCount = ceremonies.reduce<Record<string, number>>((acc, c) => { const t = c.type || 'نامشخص'; acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const typeChart = Object.entries(typeCount).map(([label, value], i) => ({ label, value, color: ['#a855f7','#3b82f6','#10b981','#f59e0b'][i % 4] }));

  const monthRev: Record<string, number> = {};
  ceremonies.forEach(c => { if (!c.date_jalali || !c.total_amount) return; const m = c.date_jalali.substring(5, 7); monthRev[m] = (monthRev[m] || 0) + c.total_amount; });
  const monthChart = Object.entries(monthRev).sort().map(([label, value]) => ({ label, value, color: '#8b5cf6' }));

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      booked: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    const lbl: Record<string, string> = { booked: 'رزرو', in_progress: 'جاری', completed: 'تکمیل', cancelled: 'لغو' };
    return <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${cls[s] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{lbl[s] || s}</span>;
  };

  const calEvents: CeremonyEvent[] = ceremonies.filter(c => c.date_jalali).map(c => ({
    id: c.id, date_jalali: c.date_jalali!, groom_name: c.groom_name, bride_name: c.bride_name,
    type: c.type, time: c.time, address: c.address, status: c.status,
  }));

  const TABS = [
    { k: 'dashboard', l: 'داشبورد', icon: LayoutDashboard },
    { k: 'ceremonies', l: 'مراسمات', icon: Calendar },
    { k: 'employees', l: 'کارمندان', icon: Users },
    { k: 'calendar', l: 'تقویم', icon: CalendarDays },
    { k: 'plans', l: 'پلن‌ها', icon: Package },
  ] as const;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-1 sm:px-8 flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map(t => {
            const TabIcon = t.icon;
            return (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === t.k ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <TabIcon className="w-4 h-4" />
                <span>{t.l}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-5 sm:space-y-8">
              <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">داشبورد مدیریت</h1></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {stats.map(s => { const Icon = s.icon; return (
                  <div key={s.title} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-5 shadow-sm">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${s.color} flex items-center justify-center mb-2 sm:mb-3`}><Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.tc}`} /></div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{s.title}</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </div>
                ); })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-500" />مراسم بر اساس نوع</h3>
                  {typeChart.length > 0 ? <BarChart data={typeChart} /> : <p className="text-gray-400 text-sm text-center py-8">بدون داده</p>}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />درآمد بر اساس ماه</h3>
                  {monthChart.length > 0 ? <BarChart data={monthChart} /> : <p className="text-gray-400 text-sm text-center py-8">بدون داده</p>}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700"><h3 className="font-bold text-gray-900 dark:text-white">آخرین قراردادها</h3></div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 dark:border-gray-700">
                      {['نوع','عروس و داماد','تاریخ','مبلغ','وضعیت'].map(h => <th key={h} className="text-right py-3 px-5 text-gray-500 dark:text-gray-400 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {ceremonies.slice(0, 6).map(c => (
                        <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-5 dark:text-gray-300">{c.type}</td>
                          <td className="py-3 px-5 dark:text-gray-300">{c.groom_name} و {c.bride_name}</td>
                          <td className="py-3 px-5 dark:text-gray-300">{c.date_jalali}</td>
                          <td className="py-3 px-5 dark:text-gray-300">{formatAmountFa(c.total_amount ?? 0)} ت</td>
                          <td className="py-3 px-5">{statusBadge(c.status)}</td>
                        </tr>
                      ))}
                      {ceremonies.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">مراسمی ثبت نشده</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {ceremonies.slice(0, 5).map(c => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm dark:text-white truncate">{c.groom_name} و {c.bride_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.type} · {c.date_jalali}</p>
                        {(c.total_amount ?? 0) > 0 && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{formatAmountFa(c.total_amount ?? 0)} ت</p>}
                      </div>
                      {statusBadge(c.status)}
                    </div>
                  ))}
                  {ceremonies.length === 0 && <p className="py-6 text-center text-gray-400 text-sm">مراسمی ثبت نشده</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ceremonies' && <CeremoniesManagement />}
          {activeTab === 'employees' && <EmployeesManagement />}
          {activeTab === 'plans' && <PlansManagement />}

          {activeTab === 'calendar' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">تقویم مراسم‌ها</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <JalaliCalendar events={calEvents} onDayClick={(d, evts) => setSelectedDay({ date: d, events: evts })} />
                </div>
                <div>
                  {selectedDay ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-3">
                      <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">مراسم {selectedDay.date}</h3>
                      {selectedDay.events.map(e => (
                        <div key={e.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-1">
                          <p className="font-medium dark:text-white">{e.type} — {e.groom_name ?? '—'} و {e.bride_name ?? '—'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">⏰ {e.time}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">📍 {e.address}</p>
                          <div className="pt-1">{statusBadge(e.status)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex items-center justify-center h-48">
                      <p className="text-gray-400 text-sm text-center">روی یک روز رنگی کلیک کنید</p>
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
