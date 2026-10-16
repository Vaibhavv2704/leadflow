"use client";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowUpRight, CalendarClock, Clock3 } from "lucide-react";
import type { Lead } from "@/lib/types";
import { isOverdue, isToday } from "@/lib/leads";
import { StatusBadge } from "@/components/leads/status-badge";
const avatarColors = [
  "avatar-indigo",
  "avatar-rose",
  "avatar-teal",
  "avatar-amber",
];
export function LeadRow({
  lead,
  now,
  onOpen,
}: {
  lead: Lead;
  now: Date;
  onOpen: () => void;
}) {
  const latest = lead.discussions[0];
  const overdue = isOverdue(lead.nextFollowUpAt, now);
  const initials = lead.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const color =
    avatarColors[
      Array.from(lead.id).reduce(
        (total, char) => total + char.charCodeAt(0),
        0,
      ) % 4
    ];
  return (
    <button
      onClick={onOpen}
      className="lead-row group"
      aria-label={`Open ${lead.name}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={`avatar ${color}`}>{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lead.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {lead.company || "Independent contact"}
          </p>
        </div>
      </div>
      <div>
        <StatusBadge status={lead.status} />
      </div>
      <div className="discussion-preview min-w-0">
        <p
          className={`truncate text-[13px] ${latest ? "text-foreground/75" : "italic text-muted-foreground"}`}
        >
          {latest?.content || "No conversations yet"}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock3 size={11} />
          {latest
            ? formatDistanceToNow(new Date(latest.createdAt), {
                addSuffix: true,
              })
            : "Start a conversation"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        {lead.nextFollowUpAt ? (
          <div
            className={`follow-up ${overdue ? "text-destructive" : "text-muted-foreground"}`}
          >
            <p className="flex items-center gap-1.5 text-xs font-medium">
              <CalendarClock size={13} />
              {isToday(lead.nextFollowUpAt, now)
                ? "Today"
                : format(new Date(lead.nextFollowUpAt), "MMM d")}
              {overdue && <span className="overdue-label">Overdue</span>}
            </p>
            <p className="mt-1 pl-5 text-[11px]">
              {format(new Date(lead.nextFollowUpAt), "h:mm a")}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/65">No follow-up</span>
        )}
        <ArrowUpRight
          size={16}
          className="row-arrow text-muted-foreground/40 transition-colors group-hover:text-primary"
        />
      </div>
    </button>
  );
}
