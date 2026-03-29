import { UserButton } from "@clerk/nextjs";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationToastProvider } from "@/components/notifications/notification-toast-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar-background lg:block">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-6">
          <span className="text-lg font-bold text-sidebar-primary">
            SupportAI
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </div>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>

      {/* Toast overlay for escalation alerts */}
      <NotificationToastProvider />
    </div>
  );
}
