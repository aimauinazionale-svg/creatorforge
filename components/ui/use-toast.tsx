"use client";

import * as React from "react";

export type ToastVariant = "default" | "destructive";

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  toast: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = randomId();
      const item: ToastItem = { id, durationMs: 4500, variant: "default", ...t };
      setToasts((prev) => [...prev, item]);

      const duration = Math.max(1500, item.durationMs ?? 4500);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider is missing");
  return ctx;
}

