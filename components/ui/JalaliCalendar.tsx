'use client';

import { useState } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DAYS_FA = ['ش','ی','د','س','چ','پ','ج'];

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

export default function JalaliCalendar({ events, onDayClick }: Props) {
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

  function dayColor(evts: CeremonyEvent[]): string {
    if (evts.length === 0) return '';
    const hasCompleted = evts.some((e) => e.status === 'completed');
    const hasActive = evts.some((e) => e.status === 'booked' || e.status === 'in_progress');
    if (hasCompleted && hasActive) return 'bg-gradient-to-br from-green-400 to-purple-500';
    if (hasCompleted) return 'bg-purple-500';
    return 'bg-green-500';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2.5 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-white" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
            {MONTHS[month - 1]} {year.toLocaleString('fa-IR')}
          </h3>
        </div>
        <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 dark:text-white" />
        </button>
      </div>
      <div className="flex gap-2 sm:gap-4 justify-center mb-2 sm:mb-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 inline-block" />رزرو</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500 inline-block" />تمام</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-200 dark:bg-gray-600 inline-block" />خالی</span>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FA.map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 py-0.5 sm:py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const evts = eventsOnDay(d);
          const color = dayColor(evts);
          const isToday = today.jy === year && today.jm === month && today.jd === d;
          const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
          return (
            <button
              key={d}
              onClick={() => evts.length > 0 && onDayClick?.(dateStr, evts)}
              className={`relative aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center text-[10px] sm:text-xs transition-all
                ${evts.length > 0 ? 'cursor-pointer hover:scale-105 shadow-sm' : 'cursor-default'}
                ${color ? `${color} text-white` : isToday ? 'ring-2 ring-purple-400 dark:text-white' : 'dark:text-gray-300'}
              `}
            >
              <span className="font-medium">{d.toLocaleString('fa-IR')}</span>
              {evts.length > 1 && (
                <span className="text-[8px] sm:text-[9px] opacity-80">{evts.length.toLocaleString('fa-IR')}×</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
