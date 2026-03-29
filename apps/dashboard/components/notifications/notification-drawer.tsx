'use client';

import { AlertTriangle, Bell, BellOff, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { EscalationNotification } from '@/hooks/use-notifications';

// ── Relative time formatting ──────────────────────────────────────────────

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) return '';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
}

// ── Priority badge ────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: EscalationNotification['priority'] }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[priority] ?? styles.medium}`}
    >
      {priority}
    </span>
  );
}

// ── Single notification item ──────────────────────────────────────────────

function NotificationItem({
  notification,
}: {
  notification: EscalationNotification;
}) {
  return (
    <Link
      href={`/conversations/${notification.conversationId}`}
      className={`group flex gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-accent/50 ${
        notification.read
          ? 'border-border/50 bg-transparent'
          : 'border-border bg-accent/20'
      }`}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            notification.priority === 'critical' || notification.priority === 'high'
              ? 'bg-red-500/15'
              : 'bg-orange-500/15'
          }`}
        >
          <AlertTriangle
            className={`h-4 w-4 ${
              notification.priority === 'critical' || notification.priority === 'high'
                ? 'text-red-400'
                : 'text-orange-400'
            }`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {notification.subject}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.contactName}
          {notification.contactEmail ? ` (${notification.contactEmail})` : ''}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <PriorityBadge priority={notification.priority} />
          <span className="text-[11px] text-muted-foreground">
            {getRelativeTime(notification.escalatedAt)}
          </span>
          {notification.assignedAgentName && (
            <span className="text-[11px] text-muted-foreground">
              &middot; {notification.assignedAgentName}
            </span>
          )}
        </div>
      </div>

      {/* Link arrow */}
      <div className="mt-0.5 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function NotificationsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <BellOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No notifications</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Escalation alerts will appear here in real time.
      </p>
    </div>
  );
}

// ── Drawer content ────────────────────────────────────────────────────────

interface NotificationDrawerProps {
  notifications: EscalationNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'polling';
}

export function NotificationDrawer({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClearAll,
  connectionStatus,
}: NotificationDrawerProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-1 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Connection indicator */}
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : connectionStatus === 'polling'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
            }`}
            title={`Connection: ${connectionStatus}`}
          />

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto py-3">
        {notifications.length === 0 ? (
          <NotificationsEmpty />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border pt-3">
          <Link
            href="/conversations?status=escalated"
            className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-3.5 w-3.5" />
            View all escalated conversations
          </Link>
        </div>
      )}
    </div>
  );
}
