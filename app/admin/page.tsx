'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, CreditCard, TrendingUp, LayoutDashboard, Users, CalendarDays, Package, Plus, X } from 'lucide-react';
import CeremoniesManagement from '@/components/admin/CeremoniesManagement';
import EmployeesManagement from '@/components/admin/EmployeesManagement';
import PlansManagement from '@/components/admin/PlansManagement';
import JalaliCalendar, { type CeremonyEvent } from '@/components/ui/JalaliCalendar';
import JalaliDatePicker from '@/components/ui/JalaliDatePicker';
import MainLayout from '@/components/layouts/MainLayout';
import apiClient from '@/lib/apiClient';
import { formatAmountFa, numberToWordsFa } from '@/utils/numberToWords';
import { toast } from 'sonner';

interface Ceremony {
  id: number; type: string; groom_name: string | null; bride_name: string | null;
  date_jalali: string | null; time: string; address: string;
  total_amount: number | null; advance_paid: number | null; status: string;
}

// Quick Reserve Modal
interface QuickReserveProps {
  initialDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

function QuickReserveModal({ initialDate, onClose, onSuccess }: QuickReserveProps) {
  const [form, setForm] = useState({ groom_name: '', bride_name: '', date_jalali: initialDate, advance_paid: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/ceremonies', {
        groom_name: form.groom_name, bride_name: form.bride_name,
        date_jalali: form.date_jalali, advance_paid: Number(form.advance_paid) || 0,
        type: 'عروسی', ceremony_mode: 'quick',
      });
      toast.success('رزرو با موفقیت ثبت شد');
      onSuccess();
      onClose();
    } catch {
      toast.error('خطا در ثبت رزرو');
    } finally { setLoading(false); }
  };

  const INPUT = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';
  const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';
  const advNum = Number(form.advance_paid) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-500" />رزرو سریع
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 dark:text-gray-300" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>نام داماد</label>
              <input value={form.groom_name} onChange={e => set('groom_name', e.target.value)} className={INPUT} placeholder="نام داماد" required />
            </div>
            <div>
              <label className={LABEL}>نام عروس</label>
              <input value={form.bride_name} onChange={e => set('bride_name', e.target.value)} className={INPUT} placeholder="نام عروس" required />
            </div>
          </div>
          <div>
            <label className={LABEL}>تاریخ مراسم</label>
            <JalaliDatePicker value={form.date_jalali} onChange={v => set('date_jalali', v)} placeholder="انتخاب تاریخ" />
          </div>
          <div>
            <label className={LABEL}>پیش‌پرداخت (تومان)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.advance_paid}
              onChange={e => set('advance_paid', e.target.value.replace(/[^0-9]/g, ''))}
              className={INPUT}
              placeholder="مثال: ۳,۰۰۰,۰۰۰"
            />
            {advNum > 0 && (
              <p className="text-xs text-purple-500 mt-1 space-x-1">
                <span>{advNum.toLocaleString('fa-IR')} تومان</span>
                <span>— {numberToWordsFa(advNum)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-60">
              {loading ? 'در حال ثبت...' : 'ثبت رزرو'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  const [quickReserveDate, setQuickReserveDate] = useState<string | null>(null);

  const fetchCeremonies = () => apiClient.get('/ceremonies').then(r => setCeremonies(r.data)).catch(() => {});
  useEffect(() => { fetchCeremonies(); }, []);

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
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">آخرین قراردادها</h3>
                  <button onClick={() => setActiveTab('ceremonies')} className="text-xs text-purple-500 hover:underline">مشاهده همه</button>
                </div>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">تقویم مراسم‌ها</h2>
                <button onClick={() => setQuickReserveDate('')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" />رزرو سریع
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <JalaliCalendar
                    events={calEvents}
                    onDayClick={(d, evts) => setSelectedDay({ date: d, events: evts })}
                    onQuickReserve={(d) => setQuickReserveDate(d)}
                  />
                </div>
                <div>
                  {selectedDay ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">مراسم {selectedDay.date}</h3>
                        <button onClick={() => setQuickReserveDate(selectedDay.date)}
                          className="flex items-center gap-1 text-xs text-purple-500 hover:underline">
                          <Plus className="w-3.5 h-3.5" />افزودن
                        </button>
                      </div>
                      {selectedDay.events.map(e => (
                        <div key={e.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-1">
                          <p className="font-medium dark:text-white text-sm">{e.type} — {e.groom_name ?? '—'} و {e.bride_name ?? '—'}</p>
                          {e.time && <p className="text-xs text-gray-500 dark:text-gray-400">⏰ {e.time}</p>}
                          {e.address && <p className="text-xs text-gray-500 dark:text-gray-400">📍 {e.address}</p>}
                          <div className="pt-1">{statusBadge(e.status)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col items-center justify-center h-48 gap-3">
                      <CalendarDays className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-400 text-sm text-center">روی روز رنگی کلیک کنید<br/>یا روی روز خالی برای رزرو سریع</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reserve Modal */}
      {quickReserveDate !== null && (
        <QuickReserveModal
          initialDate={quickReserveDate}
          onClose={() => setQuickReserveDate(null)}
          onSuccess={() => { fetchCeremonies(); setQuickReserveDate(null); }}
        />
      )}
    </MainLayout>
  );
}
