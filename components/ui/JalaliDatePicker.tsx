'use client';

import { useState, useRef, useEffect } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

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
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        calRef.current && !calRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openCalendar() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const calH = 320;
    let top = rect.bottom + window.scrollY + 4;
    if (spaceBelow < calH) top = rect.top + window.scrollY - calH - 4;
    setDropPos({ top, left: rect.right + window.scrollX - rect.width, width: Math.max(rect.width, 280) });
    setOpen((o) => !o);
  }

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

  const calendarPopup = open && dropPos ? (
    <div
      ref={calRef}
      style={{
        position: 'absolute',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
        direction: 'rtl',
      }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <ChevronRight className="w-4 h-4 dark:text-white" />
        </button>
        <span className="font-medium dark:text-white text-sm">
          {MONTHS[curMonth - 1]} {curYear.toLocaleString('fa-IR')}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
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
              className={`w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-colors ${
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
  ) : null;

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <div
        onClick={openCalendar}
        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40 flex items-center justify-between"
      >
        <span className={value ? 'dark:text-white text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
      {typeof window !== 'undefined' && createPortal(calendarPopup, document.body)}
    </div>
  );
}
