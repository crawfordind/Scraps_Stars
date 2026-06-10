"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";

type ToastTone = "default" | "success" | "error";

type ToastAction = {
  label: string;
  /** Invoked when the user activates the action (e.g. "Undo"). Cancels onExpire. */
  onClick: () => void;
};

export type ToastOptions = {
  message: string;
  tone?: ToastTone;
  /** ms before auto-dismiss. Defaults to 6000; 5000 with no action. */
  duration?: number;
  action?: ToastAction;
  /**
   * Called when the toast leaves WITHOUT the action being taken
   * (auto-dismiss or manual close). Use this to commit a deferred operation
   * such as a delete that the user chose not to undo.
   */
  onExpire?: () => void;
};

type ToastRecord = ToastOptions & { id: number };

type ToastContextValue = {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  // Remove a toast. When `viaAction` is false, run its onExpire (commit).
  const remove = useCallback(
    (id: number, viaAction: boolean) => {
      clearTimer(id);
      setToasts((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target && !viaAction) target.onExpire?.();
        return prev.filter((t) => t.id !== id);
      });
    },
    [clearTimer],
  );

  const dismissToast = useCallback((id: number) => remove(id, false), [remove]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = (idRef.current += 1);
      const duration = options.duration ?? (options.action ? 6000 : 5000);
      setToasts((prev) => [...prev, { ...options, id }]);
      const timer = setTimeout(() => remove(id, false), duration);
      timers.current.set(id, timer);
      return id;
    },
    [remove],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport
        toasts={toasts}
        onAction={(id, run) => {
          run();
          remove(id, true);
        }}
        onClose={(id) => remove(id, false)}
      />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onAction,
  onClose,
}: {
  toasts: ToastRecord[];
  onAction: (id: number, run: () => void) => void;
  onClose: (id: number) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone ?? "default"}`}
            // Polite for default/success, assertive for errors so SRs interrupt.
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={springSnappy}
          >
            <span className="toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => onAction(toast.id, toast.action!.onClick)}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => onClose(toast.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
