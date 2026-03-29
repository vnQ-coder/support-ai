"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Palette, Users, Key, Radio, Tag, MessageSquareText, Clock, ShieldAlert } from "lucide-react";

const navItems = [
  { label: "General", href: "/settings", icon: Settings },
  { label: "Channels", href: "/settings/channels", icon: Radio },
  { label: "Widget", href: "/settings/widget", icon: Palette },
  { label: "Team", href: "/settings/team", icon: Users },
  { label: "API Keys", href: "/settings/api-keys", icon: Key },
  { label: "Labels", href: "/settings/tags", icon: Tag },
  { label: "Saved Replies", href: "/settings/canned-responses", icon: MessageSquareText },
  { label: "Working Hours", href: "/settings/working-hours", icon: Clock },
  { label: "SLA Policies", href: "/settings/sla", icon: ShieldAlert },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/settings" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
