'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface EscalationNotification {
  id: string;
  conversationId: string;
  subject: string;
  contactName: string;
  contactEmail: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgentName: string | null;
  escalatedAt: string;
  read: boolean;
}

interface UseNotificationsOptions {
  orgId: string | null | undefined;
  /** Called when a new escalation arrives (for toast display) */
  onNewEscalation?: (notification: EscalationNotification) => void;
}

interface UseNotificationsReturn {
  notifications: EscalationNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'polling';
}

const MAX_NOTIFICATIONS = 50;
const POLL_INTERVAL_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

/**
 * Encapsulates SSE connection to the notifications endpoint.
 * Falls back to polling if EventSource is not available.
 * Handles reconnection with exponential backoff on disconnect.
 */
export function useNotifications({
  orgId,
  onNewEscalation,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<EscalationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'polling'
  >('disconnected');

  // Refs to keep callback stable across renders
  const onNewEscalationRef = useRef(onNewEscalation);
  onNewEscalationRef.current = onNewEscalation;

  // Track previous notification IDs to detect truly new ones
  const knownIdsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const getApiUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
  }, []);

  const processNotifications = useCallback(
    (incoming: Array<Omit<EscalationNotification, 'id' | 'read'>>) => {
      setNotifications((prev) => {
        const existingMap = new Map(prev.map((n) => [n.conversationId, n]));
        let newCount = 0;

        const merged = incoming.map((item) => {
          const existing = existingMap.get(item.conversationId);
          if (existing) {
            // Preserve read state for existing notifications
            return { ...existing, ...item, id: existing.id, read: existing.read };
          }

          // Genuinely new notification
          const notification: EscalationNotification = {
            ...item,
            id: `notif_${item.conversationId}_${Date.now()}`,
            read: false,
          };

          if (!knownIdsRef.current.has(item.conversationId)) {
            knownIdsRef.current.add(item.conversationId);
            newCount++;
            onNewEscalationRef.current?.(notification);
          }

          return notification;
        });

        if (newCount > 0) {
          setUnreadCount((c) => c + newCount);
        }

        return merged.slice(0, MAX_NOTIFICATIONS);
      });
    },
    []
  );

  // SSE connection
  useEffect(() => {
    if (!orgId) return;

    const apiUrl = getApiUrl();
    let closed = false;

    const cleanup = () => {
      closed = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    // Check if EventSource is available
    if (typeof EventSource === 'undefined') {
      // Fall back to polling
      setConnectionStatus('polling');

      const poll = async () => {
        try {
          const res = await fetch(
            `${apiUrl}/api/v1/notifications?orgId=${encodeURIComponent(orgId)}`
          );
          if (res.ok) {
            const text = await res.text();
            // Parse SSE-formatted response (data: {...}\n\n)
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.type === 'notifications' && Array.isArray(parsed.data)) {
                    processNotifications(parsed.data);
                  }
                } catch {
                  // skip malformed lines
                }
              }
            }
          }
        } catch (err) {
          console.error('[useNotifications] Polling failed:', err);
        }
      };

      void poll();
      const intervalId = setInterval(() => {
        if (!closed) void poll();
      }, POLL_INTERVAL_MS);

      return () => {
        cleanup();
        clearInterval(intervalId);
      };
    }

    const connect = () => {
      if (closed) return;

      setConnectionStatus('connecting');

      const es = new EventSource(
        `${apiUrl}/api/v1/notifications?orgId=${encodeURIComponent(orgId)}`
      );
      eventSourceRef.current = es;

      es.onopen = () => {
        if (closed) return;
        setConnectionStatus('connected');
        reconnectAttemptRef.current = 0;
      };

      es.onmessage = (event) => {
        if (closed) return;
        try {
          const parsed = JSON.parse(event.data as string) as {
            type: string;
            data?: Array<Omit<EscalationNotification, 'id' | 'read'>>;
            message?: string;
          };

          if (parsed.type === 'notifications' && Array.isArray(parsed.data)) {
            processNotifications(parsed.data);
          }
          // Ignore error-type events from SSE; just log
          if (parsed.type === 'error') {
            console.warn('[useNotifications] SSE server error:', parsed.message);
          }
        } catch (err) {
          console.error('[useNotifications] Failed to parse SSE event:', err);
        }
      };

      es.onerror = () => {
        if (closed) return;
        es.close();
        eventSourceRef.current = null;
        setConnectionStatus('disconnected');

        // Exponential backoff reconnect
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttemptRef.current = attempt + 1;

        console.warn(
          `[useNotifications] SSE disconnected. Reconnecting in ${delay}ms (attempt ${attempt + 1})...`
        );

        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return cleanup;
  }, [orgId, getApiUrl, processNotifications]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    knownIdsRef.current.clear();
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    connectionStatus,
  };
}
