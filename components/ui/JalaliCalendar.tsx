'use client';

import { useState } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DAYS_FA = ['ش','ی','د','س','چ','پ','ج'];

// مناسبت‌های ثابت شمسی  key: "ماه/روز"
const PERSIAN_EVENTS: Record<string, string> = {
  '1/1':  'نوروز',
  '1/2':  'نوروز',
  '1/3':  'نوروز',
  '1/4':  'نوروز',
  '1/12': 'جمهوری اسلامی',
  '1/13': 'سیزده‌بدر',
  '3/14': 'رحلت امام خمینی',
  '3/15': 'قیام ۱۵ خرداد',
  '6/31': 'شهریور ۱۳۵۷',
  '7/13': 'اعتراضات',
  '11/22': 'انقلاب ۵۷',
  '12/29': 'ملی شدن نفت',
};

export interface CeremonyEvent {
  id: number;
  date_jalali: string;
  groom_name: string | null;
  bride_name: string | null;
  type: string | null;
  time: string | null;
  address: string | null;
  status: string;
  tasks?: { role_description: string | null; username: string; attendance_hours?: number | null }[];
}

interface Props {
  events: CeremonyEvent[];
  onDayClick?: (date: string, events: CeremonyEvent[]) => void;
  onQuickReserve?: (date: string) => void;
  employeeView?: boolean;
}

function todayJalali() {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function jDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd);
  return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
}

export default function JalaliCalendar({ events, onDayClick, onQuickReserve, employeeView }: Props) {
  const today = todayJalali();
  const [year, setYear] = useState(today.jy);
  const [month, setMonth] = useState(today.jm);

  const daysInMonth = jalaaliMonthLength(year, month);
  const firstDow = jDayOfWeek(year, month, 1);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y: number) => y - 1); }
    else setMonth((m: number) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y: number) => y + 1); }
    else setMonth((m: number) => m + 1);
  }

  function eventsOnDay(d: number): CeremonyEvent[] {
    const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    return events.filter((e) => e.date_jalali === dateStr);
  }

  function getHolidayName(d: number): string | null {
    const key1 = `${month}/${d}`;
    return PERSIAN_EVENTS[key1] ?? null;
  }

  // رنگ‌بندی جدید: سفید = بدون مراسم | آبی = ۱ مراسم | بنفش = ۲+ مراسم
  function dayBgClass(evts: CeremonyEvent[]): string {
    if (evts.length === 0) return '';
    if (evts.length === 1) return 'bg-blue-500 text-white';
    return 'bg-purple-600 text-white';
  }

  function handleDayClick(d: number) {
    const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    const evts = eventsOnDay(d);
    if (evts.length > 0) {
      onDayClick?.(dateStr, evts);
    } else if (!employeeView) {
      onQuickReserve?.(dateStr);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2.5 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-white" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
            {MONTHS[month - 1]} {year.toLocaleString('fa-IR')}
          </h3>
        </div>
        <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 dark:text-white" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 sm:gap-4 justify-center mb-2 sm:mb-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />یک مراسم</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />چند مراسم</span>
        {!employeeView && (
          <span className="flex items-center gap-1"><Plus className="w-2.5 h-2.5 text-green-500" />رزرو سریع</span>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FA.map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 py-0.5 sm:py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const evts = eventsOnDay(d);
          const bgClass = dayBgClass(evts);
          const isToday = today.jy === year && today.jm === month && today.jd === d;
          const holiday = getHolidayName(d);
          const canClick = evts.length > 0 || (!employeeView && onQuickReserve);

          return (
            <button
              key={d}
              onClick={() => handleDayClick(d)}
              title={holiday ?? undefined}
              className={`relative aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center text-[10px] sm:text-xs transition-all
                ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${bgClass
                  ? bgClass
                  : isToday
                    ? 'ring-2 ring-purple-400 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
                ${evts.length > 0 ? 'shadow-sm' : ''}
                ${holiday && evts.length === 0 ? 'text-red-500 dark:text-red-400' : ''}
              `}
            >
              <span className="font-medium leading-none">{d.toLocaleString('fa-IR')}</span>
              {evts.length > 1 && (
                <span className="text-[8px] sm:text-[9px] opacity-80 leading-none mt-0.5">{evts.length.toLocaleString('fa-IR')}×</span>
              )}
              {/* نقطه مناسبت */}
              {holiday && (
                <span className={`absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full ${bgClass ? 'bg-white/70' : 'bg-red-400'}`} />
              )}
              {/* آیکون + برای روزهای خالی */}
              {evts.length === 0 && !employeeView && onQuickReserve && (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 text-green-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

