'use client';

import { ShieldX, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  message?: string;
}

export default function AccessDeniedModal({ onClose, message }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          دسترسی محدود شده
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          {message ?? 'شما مجوز لازم برای این عملیات را ندارید. لطفاً با مدیر سیستم تماس بگیرید.'}
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
