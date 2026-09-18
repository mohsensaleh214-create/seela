import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info';
}

interface ToastContextValue {
  show: (message: string, toneVal?: 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, toneVal: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, tone: toneVal }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2" aria-live="polite" role="status">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-[8px] bg-ink px-4 py-3 text-[15px] text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] duration-150 ease-out"
            >
              {t.tone === 'success' ? <CheckCircle2 size={16} aria-hidden /> : <Info size={16} aria-hidden />}
              {t.message}
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
                className="ml-2 rounded-full p-0.5 hover:bg-white/10"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
