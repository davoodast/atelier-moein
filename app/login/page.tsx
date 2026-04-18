'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, AlertCircle, Home } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      const role = user.role || 'employee';
      if (role === 'admin' || role === 'accountant') {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'خطا در ورود');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-deep-black via-dark-purple to-deep-black'
        : 'bg-gradient-to-br from-white to-cream'
    } flex flex-col items-center justify-center px-4`}>
      {/* Home Button */}
      <button onClick={() => router.push('/')} title="صفحه اصلی"
        className={`absolute top-6 left-6 p-3 rounded-full transition-all duration-300 ${
          isDark ? 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}>
        <Home className="w-5 h-5" />
      </button>

      {/* Theme Toggle */}
      <button onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all duration-300 ${
          isDark ? 'bg-purple-accent/20 hover:bg-purple-accent/40' : 'bg-gray-200 hover:bg-gray-300'
        }`}>
        {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-purple-600" />}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className={`rounded-2xl backdrop-blur-md p-8 md:p-12 transition-all duration-300 ${
          isDark
            ? 'bg-white/5 border border-white/10 shadow-2xl shadow-purple-accent/10'
            : 'bg-white/80 shadow-2xl shadow-purple-600/10'
        }`}>
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className={`text-4xl font-light mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              آتلیه معین
            </h1>
            <div className={`h-0.5 w-16 mx-auto mb-4 transition-colors duration-300 ${
              isDark ? 'bg-gradient-to-r from-purple-accent to-light-purple' : 'bg-gradient-to-r from-purple-600 to-purple-400'
            }`} />
            <p className={`font-light transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ورود به سیستم مدیریت
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`rounded-lg p-4 flex items-center gap-3 transition-colors duration-300 ${
                isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm font-light ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
              </div>
            )}

            <div>
              <label className={`block text-sm font-light mb-3 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                نام کاربری
              </label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg font-light transition-all duration-300 ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-purple-accent/50'
                    : 'bg-white border border-gray-200 text-gray-900 focus:bg-gray-50 focus:border-purple-600'
                } focus:outline-none focus:ring-2 focus:ring-purple-accent/30`}
                placeholder="نام کاربری" required />
            </div>

            <div>
              <label className={`block text-sm font-light mb-3 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                رمز عبور
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg font-light transition-all duration-300 ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-purple-accent/50'
                    : 'bg-white border border-gray-200 text-gray-900 focus:bg-gray-50 focus:border-purple-600'
                } focus:outline-none focus:ring-2 focus:ring-purple-accent/30`}
                placeholder="رمز عبور" required />
            </div>

            <button type="submit" disabled={isLoading}
              className={`w-full py-3 rounded-lg font-light text-lg transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-purple-accent to-light-purple text-white hover:shadow-lg hover:shadow-purple-accent/50 disabled:opacity-50'
                  : 'bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:shadow-lg hover:shadow-purple-600/50 disabled:opacity-50'
              } disabled:cursor-not-allowed`}>
              {isLoading ? 'درحال ورود...' : 'ورود'}
            </button>
          </form>

          {/* Demo Info */}
          <div className={`mt-8 pt-8 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <p className={`text-xs font-light text-center mb-3 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              اطلاعات نمونه برای آزمایش:
            </p>
            <div className={`text-xs font-light space-y-1 text-center transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>نام کاربری: <span className="font-medium">admin</span></p>
              <p>رمز عبور: <span className="font-medium">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
