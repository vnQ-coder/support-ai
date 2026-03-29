import { MessageSquare, Mail, Phone } from "lucide-react";

interface ChannelBadgeProps {
  channel: string;
}

const channelConfig: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  web_chat: {
    label: "Web Chat",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  email: {
    label: "Email",
    icon: <Mail className="h-3.5 w-3.5" />,
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <Phone className="h-3.5 w-3.5" />,
  },
};

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const config = channelConfig[channel] ?? {
    label: channel.replace("_", " "),
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {config.icon}
      {config.label}
    </span>
  );
}
