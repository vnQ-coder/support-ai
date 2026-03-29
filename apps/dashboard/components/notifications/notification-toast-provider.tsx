'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import type { EscalationNotification } from '@/hooks/use-notifications';

interface ToastItem {
  id: string;
  notification: EscalationNotification;
  visible: boolean;
}

const TOAST_DURATION_MS = 8_000;
const TOAST_EXIT_DURATION_MS = 300;

/**
 * Listens for 'supportai:escalation' CustomEvents dispatched by
 * the NotificationBell and displays a temporary toast notification.
 *
 * This is a lightweight toast implementation that does not require
 * any external toast library (sonner, react-hot-toast, etc.).
 */
export function NotificationToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear all pending timers on unmount to prevent state updates after unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    // Animate out first
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    // Then remove from DOM after animation
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_EXIT_DURATION_MS);
    timersRef.current.add(timer);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<EscalationNotification>;
      const notification = customEvent.detail;

      const id = `toast_${notification.conversationId}_${Date.now()}`;

      setToasts((prev) => {
        // Keep max 3 toasts visible at once
        const trimmed = prev.slice(-2);
        return [...trimmed, { id, notification, visible: true }];
      });

      // Auto-dismiss
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        removeToast(id);
      }, TOAST_DURATION_MS);
      timersRef.current.add(timer);
    };

    window.addEventListener('supportai:escalation', handler);
    return () => window.removeEventListener('supportai:escalation', handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notification toasts"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex w-80 items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-lg transition-all duration-300 ${
            toast.visible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0'
          }`}
          role="alert"
        >
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              New escalation
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {toast.notification.contactName} needs immediate attention
            </p>
            <Link
              href={`/conversations/${toast.notification.conversationId}`}
              className="mt-2 inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent/80"
            >
              View
            </Link>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
