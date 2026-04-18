'use client';

import { useState } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DAYS_FA = ['ش','ی','د','س','چ','پ','ج'];

const PERSIAN_EVENTS: Record<string, string> = {
  '1/1':  'نوروز',
  '1/2':  'نوروز',
  '1/3':  'نوروز',
  '1/4':  'نوروز',
  '1/12': 'جمهوری اسلامی',
  '1/13': 'سیزده‌بدر',
  '3/14': 'رحلت امام خمینی',
  '3/15': 'قیام ۱۵ خرداد',
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

function getDayStyle(count: number): { bgClass: string; textClass: string } {
  if (count === 0) return { bgClass: '', textClass: '' };
  if (count === 1) return { bgClass: 'bg-blue-400 dark:bg-blue-500', textClass: 'text-white' };
  if (count === 2) return { bgClass: 'bg-purple-500', textClass: 'text-white' };
  if (count === 3) return { bgClass: 'bg-purple-700', textClass: 'text-white' };
  return { bgClass: 'bg-purple-900', textClass: 'text-white' };
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
    return PERSIAN_EVENTS[`${month}/${d}`] ?? null;
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h3 className="font-bold text-base text-gray-900 dark:text-white">
          {MONTHS[month - 1]} {year.toLocaleString('fa-IR')}
        </h3>
        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-5 justify-center mb-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400 inline-block" />۱ مراسم</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" />۲ مراسم</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-900 inline-block" />۳+ مراسم</span>
          {!employeeView && <span className="flex items-center gap-1"><Plus className="w-3 h-3 text-green-500" />رزرو سریع</span>}
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 mb-0">
          {DAYS_FA.map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-2 ${i === 6 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-r border-gray-200 dark:border-gray-700">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`b${i}`} className="border-l border-b border-gray-100 dark:border-gray-700 h-10 sm:h-12" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const evts = eventsOnDay(d);
            const isToday_ = today.jy === year && today.jm === month && today.jd === d;
            const holiday = getHolidayName(d);
            const canClick = evts.length > 0 || (!employeeView && onQuickReserve);
            const isFriday = (firstDow + i) % 7 === 6;
            const { bgClass, textClass } = getDayStyle(evts.length);

            return (
              <button
                key={d}
                onClick={() => handleDayClick(d)}
                title={holiday ?? undefined}
                className={[
                  'relative h-10 sm:h-12 flex flex-col items-center justify-center border-l border-b border-gray-100 dark:border-gray-700 transition-all group select-none',
                  canClick ? 'cursor-pointer' : 'cursor-default',
                  bgClass,
                  textClass,
                  !bgClass && isToday_ ? 'bg-purple-100 dark:bg-purple-900/40 font-bold text-purple-700 dark:text-purple-300' : '',
                  !bgClass && isFriday && !isToday_ ? 'text-red-500 dark:text-red-400' : '',
                  !bgClass && !isToday_ && !isFriday ? 'text-gray-800 dark:text-gray-200' : '',
                  !bgClass && canClick ? 'hover:bg-gray-100 dark:hover:bg-gray-700/60' : '',
                  bgClass && canClick ? 'hover:brightness-110' : '',
                ].filter(Boolean).join(' ')}
              >
                {isToday_ && (
                  <span className={`absolute inset-0.5 rounded ring-2 pointer-events-none ${bgClass ? 'ring-white/50' : 'ring-purple-500'}`} />
                )}
                <span className="relative text-sm sm:text-base font-semibold leading-none">
                  {d.toLocaleString('fa-IR')}
                </span>
                {evts.length > 1 && (
                  <span className="relative text-[9px] opacity-90 leading-none mt-0.5">{evts.length.toLocaleString('fa-IR')}×</span>
                )}
                {evts.length === 1 && (
                  <span className="relative w-1 h-1 rounded-full bg-white/80 mt-0.5" />
                )}
                {holiday && evts.length === 0 && (
                  <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-red-400" />
                )}
                {evts.length === 0 && !employeeView && onQuickReserve && (
                  <Plus className="absolute w-3.5 h-3.5 text-green-500 opacity-0 group-hover:opacity-70 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
