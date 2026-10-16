"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useLeadMutations } from "@/hooks/use-leads";
import {
  discussionFormSchema,
  type DiscussionFormInput,
} from "@/lib/validations/leads";
type DiscussionMutation = ReturnType<typeof useLeadMutations>["discuss"];
export function DiscussionForm({
  discuss,
  disabled,
}: {
  discuss: DiscussionMutation;
  disabled: boolean;
}) {
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

  return (
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
          <span className="font-normal text-muted-foreground">(optional)</span>
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
        <Button disabled={discuss.isPending || disabled}>
          {discuss.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Save discussion
        </Button>
      </div>
    </form>
  );
}
