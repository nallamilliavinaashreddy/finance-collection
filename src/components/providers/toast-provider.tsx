'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '@/types';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, title };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-200',
              toast.type === 'success' && 'bg-emerald-950/90 border-emerald-900/80 text-emerald-200',
              toast.type === 'error' && 'bg-rose-950/90 border-rose-900/80 text-rose-200',
              toast.type === 'warning' && 'bg-amber-950/90 border-amber-900/80 text-amber-200',
              toast.type === 'info' && 'bg-[#141414] border-[#FF7A00]/30 text-white'
            )}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-[#FF7A00]" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <h4 className="font-semibold text-sm leading-tight mb-0.5">{toast.title}</h4>}
              <p className="text-sm font-normal opacity-90 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity rounded-md hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
