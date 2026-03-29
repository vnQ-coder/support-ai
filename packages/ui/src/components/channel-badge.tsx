import { MessageSquare, Mail, Phone, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../utils";

type Channel = "widget" | "web_chat" | "email" | "sms" | "whatsapp";

interface ChannelBadgeProps {
  channel: Channel | (string & {});
  className?: string;
}

const channelConfig: Record<string, { label: string; icon: LucideIcon }> = {
  widget: {
    label: "Widget",
    icon: MessageSquare,
  },
  web_chat: {
    label: "Web Chat",
    icon: MessageSquare,
  },
  email: {
    label: "Email",
    icon: Mail,
  },
  sms: {
    label: "SMS",
    icon: Smartphone,
  },
  whatsapp: {
    label: "WhatsApp",
    icon: Phone,
  },
};

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  const config = channelConfig[channel] ?? {
    label: channel.replace(/_/g, " "),
    icon: MessageSquare,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

export type { Channel };
