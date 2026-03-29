'use client';

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useOrganization } from '@clerk/nextjs';
import { useNotifications } from '@/hooks/use-notifications';
import type { EscalationNotification } from '@/hooks/use-notifications';
import { NotificationDrawer } from './notification-drawer';

/**
 * Notification bell icon for the dashboard header.
 *
 * - Connects to the SSE notifications endpoint via the useNotifications hook
 * - Shows an unread count badge (red dot) when there are unread notifications
 * - Opens a slide-out drawer (Sheet) listing escalation alerts
 * - Marks all as read when the drawer is opened
 * - Shows a toast when a new escalation arrives
 */
export function NotificationBell() {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? null;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNewEscalation = useCallback(
    (notification: EscalationNotification) => {
      // Show a simple toast-like notification via a custom event
      // The NotificationToastProvider listens for this
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('supportai:escalation', {
            detail: notification,
          })
        );
      }
    },
    []
  );

  const {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    connectionStatus,
  } = useNotifications({
    orgId,
    onNewEscalation: handleNewEscalation,
  });

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
    // Mark all as read when opening the drawer
    markAllRead();
  }, [markAllRead]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpenDrawer}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer overlay */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={handleCloseDrawer}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCloseDrawer();
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close notifications"
          />

          {/* Sheet panel */}
          <div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background p-6 shadow-xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <NotificationDrawer
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
              onClearAll={clearAll}
              connectionStatus={connectionStatus}
            />
          </div>
        </>
      )}
    </>
  );
}
