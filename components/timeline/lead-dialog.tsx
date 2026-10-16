"use client";
import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import {
  Building2,
  CalendarClock,
  Check,
  Loader2,
  MessageSquare,
  Phone,
  Send,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLead, useLeadMutations } from "@/hooks/use-leads";
import {
  discussionFormSchema,
  type DiscussionFormInput,
} from "@/lib/validations/leads";
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
  const form = useForm<DiscussionFormInput>({
    resolver: zodResolver(discussionFormSchema),
    defaultValues: { content: "", date: "", time: "" },
  });
  const followUpDate = useWatch({ control: form.control, name: "date" });
  async function submit(input: DiscussionFormInput) {
    try {
      await discuss.mutateAsync({
        content: input.content,
        ...(input.date
          ? {
              followUpAt: new Date(
                `${input.date}T${input.time || "09:00"}`,
              ).toISOString(),
            }
          : {}),
      });
      form.reset();
    } catch {
      /* Mutation displays the error; keep the draft for retry. */
    }
  }
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
            disabled={patch.isPending}
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
      <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <MessageSquare size={16} />
        Discussion history{" "}
        <span className="text-muted-foreground">
          ({data.discussions.length})
        </span>
      </h3>
      <div className="mb-6 max-h-72 overflow-y-auto pr-2">
        {!data.discussions.length ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Every relationship starts with a conversation. Add your first note
            below.
          </div>
        ) : (
          <ol className="ml-2 border-l border-border">
            {data.discussions.map((note) => (
              <li key={note.id} className="relative pb-6 pl-6 last:pb-1">
                <span className="absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                  <time dateTime={note.createdAt}>
                    {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
                  </time>
                  <span>
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {note.content}
                </p>
                {note.followUpAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock size={12} />
                    Scheduled for{" "}
                    {format(new Date(note.followUpAt), "MMM d, yyyy · h:mm a")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <form
        className="space-y-4 border-t border-border pt-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div>
          <label htmlFor="discussion-content" className="field-label">
            Add a discussion <span className="text-primary">*</span>
          </label>
          <textarea
            id="discussion-content"
            className="input min-h-24 resize-y"
            placeholder="What did you discuss? Capture the details that matter…"
            maxLength={5000}
            {...form.register("content")}
            aria-invalid={!!form.formState.errors.content}
            aria-describedby="content-error"
          />
          <p id="content-error" className="field-error">
            {form.formState.errors.content?.message}
          </p>
        </div>
        <div className="rounded-xl bg-background p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium">
            <CalendarClock size={14} />
            Schedule a follow-up{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="followup-date" className="sr-only">
                Follow-up date
              </label>
              <input
                id="followup-date"
                className="input"
                type="date"
                {...form.register("date")}
                aria-describedby="date-error"
              />
            </div>
            <div>
              <label htmlFor="followup-time" className="sr-only">
                Follow-up time
              </label>
              <input
                id="followup-time"
                className="input"
                type="time"
                {...form.register("time")}
              />
            </div>
          </div>
          <p id="date-error" className="field-error">
            {form.formState.errors.date?.message}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your local time · defaults to 9:00 AM. Leaving this blank keeps the
            existing follow-up.
          </p>
          {followUpDate && (
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-xs text-primary"
              onClick={() => {
                form.setValue("date", "");
                form.setValue("time", "");
              }}
            >
              <X size={12} />
              Remove new schedule
            </button>
          )}
        </div>
        {discuss.isError && (
          <p role="alert" className="field-error">
            {discuss.error.message}
          </p>
        )}
        <div className="flex justify-end">
          <Button disabled={discuss.isPending || patch.isPending}>
            {discuss.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Save discussion
          </Button>
        </div>
      </form>
    </>
  );
}
