'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

const SLIDES = [
  '/pic/elegant-wedding-couple_1157-18557.avif',
];

const SERVICES = ['عکاسی', 'فیلمبرداری', 'تدوین'];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (user) router.push(user.role === 'admin' || user.role === 'accountant' ? '/admin' : '/employee');
  }, [user, router]);

  useEffect(() => {
    if (SLIDES.length <= 1) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % SLIDES.length); setFading(false); }, 700);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const goTo = (i: number) => {
    if (i === idx) return;
    setFading(true);
    setTimeout(() => { setIdx(i); setFading(false); }, 350);
  };

  const n = String(idx + 1).padStart(2, '0');
  const tot = String(SLIDES.length).padStart(2, '0');

  return (
    <div className="relative overflow-hidden bg-black" style={{ width: '100vw', height: '100dvh', minHeight: '-webkit-fill-available' }}>
      {/* Background */}
      <img key={idx} src={SLIDES[idx]} alt="" draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.7s ease', zIndex: 0 }} />

      {/* Gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2,
        background: 'linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 40%,rgba(0,0,0,0.1) 60%,rgba(0,0,0,0.7) 100%)' }} />

      {/* Inner frame – desktop */}
      <div className="absolute pointer-events-none hidden sm:block" style={{ zIndex: 3, inset: 22,
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }} />

      {/* Top bar */}
      <header className="absolute left-0 right-0 z-20 flex items-center justify-between"
        style={{ top: 0, paddingTop: 'max(env(safe-area-inset-top),18px)', paddingLeft: 'max(env(safe-area-inset-left),22px)',
          paddingRight: 'max(env(safe-area-inset-right),22px)', paddingBottom: 14 }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', fontWeight: 300 }}>
          Atelier Moein
        </span>
        <button onClick={toggleTheme} className="p-1 hover:opacity-70 transition-opacity" aria-label="تغییر تم"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </header>

      {/* Slide counter – desktop left side */}
      {SLIDES.length > 1 && (
        <div className="absolute z-20 hidden sm:flex flex-col items-center gap-2"
          style={{ top: '50%', transform: 'translateY(-50%)', left: 28 }}>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: '0.05em' }}>{n}</span>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.18)' }} />
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, letterSpacing: '0.05em' }}>{tot}</span>
        </div>
      )}

      {/* Center */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6"
        style={{ paddingLeft: 'max(env(safe-area-inset-left),24px)', paddingRight: 'max(env(safe-area-inset-right),24px)' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 18, fontWeight: 300 }}>
          Photography &amp; Cinematography
        </p>
        <h1 style={{ color: '#fff', fontWeight: 200, fontSize: 'clamp(2.8rem,11vw,7rem)',
          letterSpacing: '-0.01em', lineHeight: 1.05, marginBottom: 0, textShadow: '0 2px 60px rgba(0,0,0,0.35)' }}>
          آتلیه معین
        </h1>
        <div className="flex items-center gap-4 my-5">
          <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,0.18)' }} />
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, letterSpacing: '0.35em' }}>MMXXVI</span>
          <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,0.18)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, fontWeight: 300, letterSpacing: '0.12em', marginBottom: 34 }}>
          ثبت لحظات ناب با هنر و ظرافت
        </p>
        <button onClick={() => router.push('/login')}
          style={{ padding: '13px 38px', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase',
            fontWeight: 300, color: '#fff', border: '1px solid rgba(255,255,255,0.26)',
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            transition: 'all 0.3s', minHeight: 44, minWidth: 160, cursor: 'pointer' }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.11)'; b.style.borderColor = 'rgba(255,255,255,0.55)'; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.04)'; b.style.borderColor = 'rgba(255,255,255,0.26)'; }}>
          ورود به سیستم
        </button>
      </div>

      {/* Bottom */}
      <div className="absolute left-0 right-0 z-20" style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Dots – mobile */}
        {SLIDES.length > 1 && (
          <div className="flex justify-center gap-2 pb-3 sm:hidden">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`اسلاید ${i + 1}`}
                style={{ width: i === idx ? 22 : 5, height: 2, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 1,
                  background: i === idx ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', transition: 'all 0.4s' }} />
            ))}
          </div>
        )}
        {/* Services */}
        <div className="flex" style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          {SERVICES.map((s, i) => (
            <div key={s} className="flex-1 flex items-center justify-center"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', padding: '13px 4px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 300, letterSpacing: '0.2em' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dots – desktop */}
      {SLIDES.length > 1 && (
        <div className="absolute z-20 hidden sm:flex gap-2" style={{ bottom: 50, left: '50%', transform: 'translateX(-50%)' }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`اسلاید ${i + 1}`}
              style={{ width: i === idx ? 28 : 5, height: 2, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 1,
                background: i === idx ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)', transition: 'all 0.45s' }} />
          ))}
        </div>
      )}
    </div>
  );
}
