'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem { id: number; msg: string; type: ToastType; }

interface ToastContextValue { toast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  let nextId = 0;

  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setItems(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap">
        {items.map(t => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
          const col = t.type === 'success' ? 'var(--app-success)' : t.type === 'error' ? 'var(--app-danger)' : 'var(--app-accent)';
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icon size={18} style={{ color: col }} />
              <span>{t.msg}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
