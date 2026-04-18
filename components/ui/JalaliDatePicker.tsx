'use client';

import { useState, useRef, useEffect } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DAYS_FA = ['ش','ی','د','س','چ','پ','ج'];

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

function todayJalali() {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function jDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd);
  const dow = new Date(g.gy, g.gm - 1, g.gd).getDay();
  return (dow + 1) % 7;
}

export default function JalaliDatePicker({ value, onChange, placeholder = 'انتخاب تاریخ', className = '' }: Props) {
  const today = todayJalali();
  const [open, setOpen] = useState(false);
  const [curYear, setCurYear] = useState(() => {
    if (value) return parseInt(value.split('/')[0]);
    return today.jy;
  });
  const [curMonth, setCurMonth] = useState(() => {
    if (value) return parseInt(value.split('/')[1]);
    return today.jm;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = jalaaliMonthLength(curYear, curMonth);
  const firstDow = jDayOfWeek(curYear, curMonth, 1);

  function selectDay(d: number) {
    const mm = String(curMonth).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${curYear}/${mm}/${dd}`);
    setOpen(false);
  }

  function prevMonth() {
    if (curMonth === 1) { setCurMonth(12); setCurYear((y: number) => y - 1); }
    else setCurMonth((m: number) => m - 1);
  }
  function nextMonth() {
    if (curMonth === 12) { setCurMonth(1); setCurYear((y: number) => y + 1); }
    else setCurMonth((m: number) => m + 1);
  }

  const selParts = value ? value.split('/') : [];
  const isSelected = (d: number) => selParts[0] === String(curYear) && parseInt(selParts[1]) === curMonth && parseInt(selParts[2]) === d;
  const isToday = (d: number) => today.jy === curYear && today.jm === curMonth && today.jd === d;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <input
        readOnly
        value={value}
        onClick={() => setOpen((o) => !o)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
      />
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-3 bottom-4 z-50 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-3 sm:min-w-[280px] sm:w-full max-w-sm mx-auto sm:mx-0"
            style={{ direction: 'rtl' }}
          >
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <ChevronRight className="w-4 h-4 dark:text-white" />
              </button>
              <span className="font-medium dark:text-white text-sm">
                {MONTHS[curMonth - 1]} {curYear.toLocaleString('fa-IR')}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <ChevronLeft className="w-4 h-4 dark:text-white" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FA.map((d) => (
                <div key={d} className="text-center text-[10px] sm:text-[11px] text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const sel = isSelected(d);
                const tod = isToday(d);
                return (
                  <button
                    key={d}
                    onClick={() => selectDay(d)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto text-xs sm:text-[13px] rounded-full transition-colors ${
                      sel ? 'bg-purple-600 text-white font-medium' :
                      tod ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' :
                      'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {d.toLocaleString('fa-IR')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
