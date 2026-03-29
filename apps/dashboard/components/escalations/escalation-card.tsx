import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { WaitTime } from "./wait-time";
import type { EscalatedConversation } from "@/lib/queries/escalations";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface EscalationCardProps {
  conversation: EscalatedConversation;
}

export function EscalationCard({ conversation }: EscalationCardProps) {
  const hoursSince = (Date.now() - conversation.updatedAt.getTime()) / 3600000;
  const borderColor =
    hoursSince >= 4
      ? "border-l-destructive"
      : hoursSince >= 1
      ? "border-l-amber-500"
      : "border-l-primary";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Contact */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={conversation.contact?.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(conversation.contact?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {conversation.contact?.name ?? "Unknown"}
            </span>
            <ChannelBadge channel={conversation.channel} />
            <WaitTime since={conversation.updatedAt} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {conversation.subject ?? "No subject"}
          </p>
          <p className="text-xs text-muted-foreground">
            {conversation.contact?.email ?? ""}
          </p>
        </div>
        {/* Assignee */}
        <div className="shrink-0 text-center hidden sm:block">
          {conversation.assignee ? (
            <div className="flex flex-col items-center gap-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={conversation.assignee.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(conversation.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {conversation.assignee.name}
              </span>
            </div>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
              Unassigned
            </Badge>
          )}
        </div>
        {/* CTA */}
        <Button asChild size="sm" className="shrink-0">
          <Link href={`/conversations/${conversation.id}`}>Handle</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
