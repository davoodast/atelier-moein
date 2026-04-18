'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { formatAmountFa } from '@/utils/numberToWords';

interface Plan {
  id: number; name: string; description: string | null;
  price: number | null; features: string; is_active: number;
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';
const EMPTY = { name: '', description: '', price: 0, features: [''] as string[], is_active: true };

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY, features: [''] as string[] });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try { const r = await apiClient.get('/plans'); setPlans(r.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openNew = () => { setForm({ ...EMPTY, features: [''] }); setEditingId(null); setShowForm(true); };

  const handleEdit = (p: Plan) => {
    let feats: string[] = [''];
    try { feats = JSON.parse(p.features); if (!feats.length) feats = ['']; } catch { feats = ['']; }
    setForm({ name: p.name, description: p.description ?? '', price: p.price ?? 0, features: feats, is_active: !!p.is_active });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, features: form.features.filter((f) => f.trim()) };
    try {
      if (editingId) await apiClient.put(`/plans/${editingId}`, payload);
      else await apiClient.post('/plans', payload);
      fetchPlans(); setShowForm(false); setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف شود؟')) return;
    try { await apiClient.delete(`/plans/${id}`); fetchPlans(); } catch (e) { console.error(e); }
  };

  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, ''] }));
  const removeFeature = (i: number) => setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const setFeature = (i: number, v: string) => setForm((f) => { const feats = [...f.features]; feats[i] = v; return { ...f, features: feats }; });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold dark:text-white">مدیریت پلن‌ها</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />پلن جدید
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold dark:text-white">{editingId ? 'ویرایش پلن' : 'پلن جدید'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={LABEL}>نام پلن</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={INPUT} placeholder="مثال: پلن نقره‌ای" required /></div>
              <div><label className={LABEL}>قیمت (تومان)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))} className={INPUT} min={0} />
                {(form.price ?? 0) > 0 && <p className="text-xs text-purple-500 mt-1">{formatAmountFa(form.price ?? 0)} تومان</p>}
              </div>
              <div className="sm:col-span-2"><label className={LABEL}>توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={INPUT} rows={2} placeholder="شرح مختصر از پلن..." /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL + ' mb-0'}>خدمات شامل پلن</label>
                <button type="button" onClick={addFeature} className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" />افزودن آیتم
                </button>
              </div>
              <div className="space-y-2">
                {form.features.map((feat, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={feat} onChange={(e) => setFeature(i, e.target.value)} className={INPUT + ' flex-1'} placeholder={`خدمت ${i + 1}`} />
                    {form.features.length > 1 && (
                      <button type="button" onClick={() => removeFeature(i)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <label htmlFor="is_active" className="text-sm text-gray-600 dark:text-gray-400">پلن فعال</label>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                {editingId ? 'بروزرسانی' : 'ذخیره پلن'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm">انصراف</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">در حال بارگذاری...</p>}
      {!loading && plans.length === 0 && !showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm">
          <p className="text-gray-400 mb-3">هنوز پلنی تعریف نشده</p>
          <button onClick={openNew} className="text-purple-600 text-sm hover:underline">اولین پلن را اضافه کنید</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {plans.map((p) => {
          let feats: string[] = [];
          try { feats = JSON.parse(p.features); } catch { feats = []; }
          return (
            <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 border-t-4 ${p.is_active ? 'border-purple-500' : 'border-gray-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold dark:text-white">{p.name}</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mt-0.5">{formatAmountFa(p.price ?? 0)} تومان</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {p.description && <p className="text-sm text-gray-500 dark:text-gray-400">{p.description}</p>}
              {feats.length > 0 && (
                <ul className="space-y-1">
                  {feats.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              )}
              {!p.is_active && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded self-start">غیرفعال</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
