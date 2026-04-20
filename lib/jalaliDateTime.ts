import { toGregorian } from 'jalaali-js';

function toEnDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Parse Jalali date + optional HH:mm time into a JS Date.
 * Returns null for invalid inputs.
 */
export function parseJalaliDateTime(dateJalali?: string | null, time?: string | null): Date | null {
  if (!dateJalali) return null;

  const normDate = toEnDigits(String(dateJalali).trim());
  const m = normDate.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;

  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (!jy || jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;

  const { gy, gm, gd } = toGregorian(jy, jm, jd);

  let hh = 23;
  let mm = 59;

  if (time && String(time).trim()) {
    const normTime = toEnDigits(String(time).trim());
    const mt = normTime.match(/^(\d{1,2}):(\d{2})$/);
    if (mt) {
      hh = Math.min(23, Math.max(0, Number(mt[1])));
      mm = Math.min(59, Math.max(0, Number(mt[2])));
    }
  }

  return new Date(gy, gm - 1, gd, hh, mm, 0, 0);
}
