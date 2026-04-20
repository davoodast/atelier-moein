'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Home, User } from 'lucide-react';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleHome = () => {
    if (!user) { router.push('/'); return; }
    const isAdminUser = user.role === 'admin' || user.role === 'accountant' || user.isSystem === true;
    router.push(isAdminUser ? '/admin' : '/profile');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 shadow-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            آتلیه معین
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
              {user.username}
            </span>
          )}
          <button
            onClick={handleHome}
            title="صفحه اصلی"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {user && (
            <button
              onClick={() => router.push('/profile')}
              title="پروفایل شخصی"
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            suppressHydrationWarning
          >
            {!mounted ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition"
              title="خروج"
            >
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
