import { z } from "zod";
import { statuses } from "@/lib/types";
const optionalText = (length: number) =>
  z
    .string()
    .trim()
    .max(length)
    .transform((value) => value || null)
    .optional();
export const createLeadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter a full name.")
      .max(120, "Use 120 characters or fewer."),
    company: optionalText(160),
    phone: z
      .string()
      .trim()
      .max(40, "Use 40 characters or fewer.")
      .refine(
        (value) =>
          !value ||
          (/^[+\d\s().\-xext#]+$/i.test(value) &&
            (value.match(/\d/g)?.length ?? 0) >= 5),
        "Enter a valid phone number, including country code if needed.",
      )
      .transform((value) => value || null)
      .optional(),
  })
  .strict();
const timestamp = z.iso
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(new Date(value).getTime()),
    "Enter a valid date and time.",
  );
export const patchLeadSchema = z
  .object({
    status: z.enum(statuses).optional(),
    nextFollowUpAt: timestamp.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide a status or follow-up to update.",
  );
export const discussionSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Write a discussion note.")
      .max(5000, "Use 5,000 characters or fewer."),
    followUpAt: timestamp.optional(),
  })
  .strict();
export const discussionFormSchema = z
  .object({
    content: z.string().trim().min(1, "Write a discussion note.").max(5000),
    date: z.string(),
    time: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.time && !value.date)
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Choose a date for this time.",
      });
    if (value.date) {
      const parsed = new Date(`${value.date}T${value.time || "09:00"}`);
      if (
        !Number.isFinite(parsed.getTime()) ||
        localDateValue(parsed) !== value.date ||
        (value.time && localTimeValue(parsed) !== value.time)
      )
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message:
            "Choose a valid local date and time (this time may not exist during a clock change).",
        });
    }
  });
export function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function localTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type DiscussionFormInput = z.input<typeof discussionFormSchema>;
