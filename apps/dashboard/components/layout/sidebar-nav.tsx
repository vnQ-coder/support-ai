"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  badge?: number;
}

interface SidebarNavProps {
  escalationCount?: number;
}

export function SidebarNav({ escalationCount = 0 }: SidebarNavProps) {
  const pathname = usePathname();

  const NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/overview" },
    { label: "Conversations", href: "/conversations" },
    { label: "Escalations", href: "/escalations", badge: escalationCount },
    { label: "Contacts", href: "/contacts" },
    { label: "Knowledge Base", href: "/knowledge" },
    { label: "Analytics", href: "/analytics" },
    { label: "Billing", href: "/billing" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="space-y-1 p-4">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
