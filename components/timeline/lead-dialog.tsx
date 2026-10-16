"use client";
import { DiscussionForm } from "./discussion-form";
import { DiscussionTimeline } from "./discussion-timeline";
import { useRef } from "react";
import { format } from "date-fns";
import { Building2, CalendarClock, Check, Loader2, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLead, useLeadMutations } from "@/hooks/use-leads";
import { statusLabels, statuses, type LeadStatus } from "@/lib/types";
import { StatusBadge } from "@/components/leads/status-badge";
import { isOverdue } from "@/lib/leads";
export function LeadDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={!!id}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl"
        onOpenAutoFocus={() => {
          returnFocus.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {id && <LeadDetail key={id} id={id} />}
      </DialogContent>
    </Dialog>
  );
}
function LeadDetail({ id }: { id: string }) {
  const lead = useLead(id);
  const { patch, discuss } = useLeadMutations(id);
  if (lead.isPending)
    return (
      <>
        <DialogTitle className="text-lg font-semibold">
          Loading lead
        </DialogTitle>
        <DialogDescription className="sr-only">
          Loading lead details and discussions.
        </DialogDescription>
        <div className="mt-5 space-y-4" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-accent" />
          ))}
        </div>
      </>
    );
  if (lead.isError)
    return (
      <>
        <DialogTitle className="text-lg font-semibold">
          Unable to open lead
        </DialogTitle>
        <DialogDescription className="my-4 text-muted-foreground">
          {lead.error.message}
        </DialogDescription>
        <Button onClick={() => lead.refetch()}>Try again</Button>
      </>
    );
  const data = lead.data;
  return (
    <>
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
        {data.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </div>
      <DialogTitle className="pr-8 text-2xl font-semibold tracking-tight">
        {data.name}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Lead details, status, follow-up, and discussion history.
      </DialogDescription>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {data.company && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={14} />
            {data.company}
          </span>
        )}
        {data.phone && (
          <a
            className="inline-flex items-center gap-1.5 hover:text-primary"
            href={`tel:${data.phone.replace(/[^+\d]/g, "")}`}
          >
            <Phone size={14} />
            {data.phone}
          </a>
        )}
      </div>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/70 p-4">
        <StatusBadge status={data.status} />
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="lead-status">
            Lead status
          </label>
          <select
            id="lead-status"
            className="input h-9 w-auto text-xs"
            disabled={patch.isPending || discuss.isPending}
            value={data.status}
            onChange={(event) =>
              patch.mutate({ status: event.target.value as LeadStatus })
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          {patch.isPending && <Loader2 size={15} className="animate-spin" />}
        </div>
      </div>
      {data.nextFollowUpAt ? (
        <div
          className={`mb-6 flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm ${isOverdue(data.nextFollowUpAt, new Date()) ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"}`}
        >
          <CalendarClock size={17} />
          <div className="flex-1">
            <span className="block text-xs font-medium">
              {isOverdue(data.nextFollowUpAt, new Date())
                ? "Overdue follow-up"
                : "Next follow-up"}
            </span>
            {format(new Date(data.nextFollowUpAt), "MMM d, yyyy · h:mm a")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={patch.isPending}
            onClick={() => patch.mutate({ nextFollowUpAt: null })}
          >
            <Check size={14} />
            Mark complete
          </Button>
        </div>
      ) : (
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock size={15} />
          No follow-up scheduled
        </p>
      )}
      <DiscussionTimeline discussions={data.discussions} />
      <DiscussionForm discuss={discuss} disabled={patch.isPending} />
    </>
  );
}
