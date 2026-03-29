"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/overview" },
  { label: "Conversations", href: "/conversations" },
  { label: "Contacts", href: "/contacts" },
  { label: "Knowledge Base", href: "/knowledge" },
  { label: "Analytics", href: "/analytics" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-4">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
