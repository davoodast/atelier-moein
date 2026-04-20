'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, FileText, ChevronDown, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasAnyPermission } from '@/lib/clientPermissions';
import apiClient from '@/lib/apiClient';
import JalaliDatePicker from '@/components/ui/JalaliDatePicker';
import TaskAssignment from './TaskAssignment';
import { numberToWordsFa, formatAmountFa } from '@/utils/numberToWords';
import { toast } from 'sonner';

interface Ceremony {
  id: number; type: string | null; groom_name: string | null; bride_name: string | null;
  date_jalali: string | null; time: string | null; address: string | null;
  total_amount: number | null; advance_paid: number | null; status: string;
  plan_id: number | null; ceremony_mode: string | null;
}
interface Plan { id: number; name: string; price: number | null; description: string | null; features: string; }

const EMPTY_FORM = {
  type: 'عروسی', groom_name: '', bride_name: '', date_jalali: '',
  time: '', address: '', total_amount: 0, advance_paid: 0, plan_id: '', ceremony_mode: 'quick',
};

// Normalize Persian/Arabic digits to ASCII
function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

export default function CeremoniesManagement() {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];

  // Fine-grained permission flags
  const canCreate  = hasAnyPermission(perms, ['ceremonies.create']);
  const canEdit    = hasAnyPermission(perms, ['ceremonies.edit']);
  const canDelete  = hasAnyPermission(perms, ['ceremonies.delete']);
  const canAssign  = hasAnyPermission(perms, ['ceremonies.assignments.manage']);

  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskCeremony, setTaskCeremony] = useState<{ id: number; label: string } | null>(null);
  const [formMode, setFormMode] = useState<'quick' | 'full'>('quick');
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const set = (k: string, v: string | number) => setFormData((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetchCeremonies();
    apiClient.get('/plans').then((r) => setPlans(r.data)).catch(() => {});
  }, []);

  const fetchCeremonies = async () => {
    setLoading(true);
    try { const r = await apiClient.get('/ceremonies'); setCeremonies(r.data); }
    catch { toast.error('خطا در بارگذاری مراسمات'); } finally { setLoading(false); }
  };

  const openNew = () => {
    if (!canCreate) { toast.error('مجوز ایجاد مراسم را ندارید'); return; }
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormMode('quick');
    setShowForm(true);
  };

  const handleEdit = (c: Ceremony) => {
    if (!canEdit) { toast.error('مجوز ویرایش مراسم را ندارید'); return; }
    setFormData({
      type: c.type ?? 'عروسی', groom_name: c.groom_name ?? '', bride_name: c.bride_name ?? '',
      date_jalali: c.date_jalali ?? '', time: c.time ?? '', address: c.address ?? '',
      total_amount: c.total_amount ?? 0, advance_paid: c.advance_paid ?? 0,
      plan_id: c.plan_id ? String(c.plan_id) : '', ceremony_mode: c.ceremony_mode ?? 'quick',
    });
    setFormMode(c.ceremony_mode === 'full' ? 'full' : 'quick');
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = formMode === 'quick'
      ? { groom_name: formData.groom_name, bride_name: formData.bride_name, date_jalali: formData.date_jalali, advance_paid: Number(formData.advance_paid) || 0, type: 'عروسی', ceremony_mode: 'quick' }
      : { ...formData, plan_id: formData.plan_id ? Number(formData.plan_id) : null, total_amount: Number(formData.total_amount) || 0, advance_paid: Number(formData.advance_paid) || 0, ceremony_mode: 'full' };
    try {
      if (editingId) {
        await apiClient.put(`/ceremonies/${editingId}`, payload);
        toast.success('مراسم بروزرسانی شد');
      } else {
        await apiClient.post('/ceremonies', payload);
        toast.success(formMode === 'quick' ? 'رزرو سریع ثبت شد' : 'قرارداد کامل ثبت شد');
      }
      fetchCeremonies(); setShowForm(false); setEditingId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'خطا در ذخیره اطلاعات');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) { toast.error('مجوز حذف مراسم را ندارید'); return; }
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      await apiClient.delete(`/ceremonies/${id}`);
      fetchCeremonies();
      toast.success('مراسم حذف شد');
    } catch { toast.error('خطا در حذف مراسم'); }
  };

  const filtered = ceremonies.filter((c) =>
    (c.groom_name ?? '').includes(searchQuery) ||
    (c.bride_name ?? '').includes(searchQuery) ||
    (c.date_jalali ?? '').includes(searchQuery)
  );

  const statusLabel: Record<string, { text: string; cls: string }> = {
    booked: { text: 'رزرو', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    in_progress: { text: 'جاری', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    completed: { text: 'تکمیل', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    cancelled: { text: 'لغو', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold dark:text-white">مدیریت مراسمات</h2>
        {canCreate && (
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">رزرو جدید</span>
            <span className="sm:hidden">رزرو</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="جستجو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setFormMode('quick')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${formMode === 'quick' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
              <Plus className="w-4 h-4" />رزرو سریع
            </button>
            <button type="button" onClick={() => setFormMode('full')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${formMode === 'full' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
              <FileText className="w-4 h-4" />قرارداد کامل
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {formMode === 'quick' && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500">رزرو اولیه — فقط اطلاعات ضروری</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={LABEL}>نام داماد</label>
                    <input type="text" value={formData.groom_name} onChange={(e) => set('groom_name', e.target.value)} className={INPUT} placeholder="نام داماد" required /></div>
                  <div><label className={LABEL}>نام عروس</label>
                    <input type="text" value={formData.bride_name} onChange={(e) => set('bride_name', e.target.value)} className={INPUT} placeholder="نام عروس" required /></div>
                  <div><label className={LABEL}>تاریخ مراسم</label>
                    <JalaliDatePicker value={formData.date_jalali} onChange={(v) => set('date_jalali', v)} placeholder="انتخاب تاریخ" /></div>
                  <div><label className={LABEL}>پیش‌پرداخت (تومان)</label>
                    <input type="text" inputMode="numeric" value={Number(formData.advance_paid) > 0 ? Number(formData.advance_paid).toLocaleString('fa-IR') : ''} onChange={(e) => set('advance_paid', parseInt(toEnDigits(e.target.value).replace(/[^0-9]/g, '')) || 0)} className={INPUT} placeholder="مثال: ۳،۰۰۰،۰۰۰" />
                    {Number(formData.advance_paid) > 0 && <p className="text-xs text-purple-500 mt-1">{Number(formData.advance_paid).toLocaleString('fa-IR')} — {numberToWordsFa(Number(formData.advance_paid))}</p>}
                  </div>
                </div>
              </>
            )}
            {formMode === 'full' && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500">قرارداد کامل — تمامی جزئیات</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={LABEL}>نوع مراسم</label>
                    <div className="relative">
                      <select value={formData.type} onChange={(e) => set('type', e.target.value)} className={INPUT + ' appearance-none pr-3'}>
                        <option>عروسی</option><option>عقد</option><option>جشن تولد</option><option>دیگر</option>
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div><label className={LABEL}>نام داماد</label><input type="text" value={formData.groom_name} onChange={(e) => set('groom_name', e.target.value)} className={INPUT} required /></div>
                  <div><label className={LABEL}>نام عروس</label><input type="text" value={formData.bride_name} onChange={(e) => set('bride_name', e.target.value)} className={INPUT} required /></div>
                  <div><label className={LABEL}>تاریخ</label><JalaliDatePicker value={formData.date_jalali} onChange={(v) => set('date_jalali', v)} placeholder="انتخاب تاریخ" /></div>
                  <div><label className={LABEL}>ساعت</label><input type="time" value={formData.time} onChange={(e) => set('time', e.target.value)} className={INPUT} /></div>
                  <div><label className={LABEL}>آدرس</label><input type="text" value={formData.address} onChange={(e) => set('address', e.target.value)} className={INPUT} /></div>
                  <div><label className={LABEL}>مبلغ کل (تومان)</label>
                    <input type="text" inputMode="numeric" value={Number(formData.total_amount) > 0 ? Number(formData.total_amount).toLocaleString('fa-IR') : ''} onChange={(e) => set('total_amount', parseInt(toEnDigits(e.target.value).replace(/[^0-9]/g, '')) || 0)} className={INPUT} placeholder="مثال: ۱۵،۰۰۰،۰۰۰" />
                    {Number(formData.total_amount) > 0 && <p className="text-xs text-purple-500 mt-1">{Number(formData.total_amount).toLocaleString('fa-IR')} — {numberToWordsFa(Number(formData.total_amount))}</p>}
                  </div>
                  <div><label className={LABEL}>پیش‌پرداخت (تومان)</label>
                    <input type="text" inputMode="numeric" value={Number(formData.advance_paid) > 0 ? Number(formData.advance_paid).toLocaleString('fa-IR') : ''} onChange={(e) => set('advance_paid', parseInt(toEnDigits(e.target.value).replace(/[^0-9]/g, '')) || 0)} className={INPUT} placeholder="مثال: ۳،۰۰۰،۰۰۰" />
                    {Number(formData.advance_paid) > 0 && <p className="text-xs text-purple-500 mt-1">{Number(formData.advance_paid).toLocaleString('fa-IR')} — {numberToWordsFa(Number(formData.advance_paid))}</p>}
                  </div>
                  {plans.length > 0 && (
                    <div className="sm:col-span-2"><label className={LABEL}>پلن خدمات</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {plans.map((p) => {
                          const selected = String(formData.plan_id) === String(p.id);
                          let feats: string[] = [];
                          try { feats = JSON.parse(p.features); } catch { feats = []; }
                          return (
                            <button key={p.id} type="button" onClick={() => set('plan_id', selected ? '' : p.id)}
                              className={`text-right p-3 rounded-lg border-2 transition-all ${selected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}>
                              <p className="font-medium text-sm dark:text-white">{p.name}</p>
                              <p className="text-purple-600 text-xs mt-0.5">{formatAmountFa(p.price ?? 0)} ت</p>
                              {feats.slice(0, 2).map((f, i) => <p key={i} className="text-[11px] text-gray-400 mt-0.5">• {f}</p>)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                {editingId ? 'بروزرسانی' : formMode === 'quick' ? 'ثبت رزرو' : 'ثبت قرارداد'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>{['نوع','عروس و داماد','تاریخ','مبلغ','وضعیت','عملیات'].map((h) =>
              <th key={h} className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">در حال بارگذاری...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">مراسمی یافت نشد</td></tr>
              : filtered.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">{c.type}
                      {c.ceremony_mode === 'full' && <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">کامل</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">{c.groom_name} و {c.bride_name}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{c.date_jalali}</td>
                  <td className="px-4 py-3 dark:text-gray-300">
                    <div>{formatAmountFa(c.total_amount ?? 0)} ت</div>
                    {(c.total_amount ?? 0) > 0 && <div className="text-[10px] text-gray-400">{numberToWordsFa(c.total_amount ?? 0)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusLabel[c.status]?.cls || 'bg-gray-100 text-gray-600'}`}>{statusLabel[c.status]?.text || c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canAssign && (
                        <button onClick={() => setTaskCeremony({ id: c.id, label: `${c.groom_name ?? ''} و ${c.bride_name ?? ''}` })}
                          className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg" title="تخصیص کارمند">
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg" title="ویرایش"><Edit className="w-4 h-4" /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      )}
                      {!canAssign && !canEdit && !canDelete && (
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Lock className="w-3 h-3" />فقط مشاهده</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && <p className="text-center text-gray-400 py-6">در حال بارگذاری...</p>}
        {!loading && filtered.length === 0 && <p className="text-center text-gray-400 py-6">مراسمی یافت نشد</p>}
        {filtered.map((c) => (
          <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium dark:text-white text-sm">{c.groom_name} و {c.bride_name}</p>
                  {c.ceremony_mode === 'full' && <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">کامل</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.type} • {c.date_jalali}</p>
                {(c.total_amount ?? 0) > 0 && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{formatAmountFa(c.total_amount ?? 0)} ت</p>}
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel[c.status]?.cls || 'bg-gray-100 text-gray-600'}`}>{statusLabel[c.status]?.text || c.status}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canAssign && (
                  <button onClick={() => setTaskCeremony({ id: c.id, label: `${c.groom_name ?? ''} و ${c.bride_name ?? ''}` })} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"><Users className="w-4 h-4" /></button>
                )}
                {canEdit && (
                  <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"><Edit className="w-4 h-4" /></button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                )}
                {!canAssign && !canEdit && !canDelete && (
                  <span className="p-2 text-gray-300"><Lock className="w-4 h-4" /></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {taskCeremony && (
        <TaskAssignment ceremonyId={taskCeremony.id} ceremonyLabel={taskCeremony.label} onClose={() => setTaskCeremony(null)} isAdmin={user?.role === 'admin' || user?.role === 'accountant' || (user?.permissions?.includes('role.manage_system') ?? false)} />
      )}
    </div>
  );
}
