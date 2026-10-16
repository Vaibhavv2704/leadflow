import { describe, expect, it } from "vitest";
import { isOverdue, isToday, selectLeads } from "@/lib/leads";
import type { Lead } from "@/lib/types";
import {
  createLeadSchema,
  discussionFormSchema,
  discussionSchema,
  patchLeadSchema,
} from "@/lib/validations/leads";
const lead = (
  id: string,
  date: string | null,
  name = "Ananya Sharma",
  status: Lead["status"] = "NEW",
): Lead => ({
  id,
  name,
  company: null,
  phone: null,
  status,
  nextFollowUpAt: date,
  discussions: [],
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
});
describe("validation", () => {
  it("trims inputs and accepts international phones", () =>
    expect(
      createLeadSchema.parse({
        name: "  Ana  ",
        company: " ",
        phone: "+91 (987) 654-3210 ext 2",
      }),
    ).toEqual({
      name: "Ana",
      company: null,
      phone: "+91 (987) 654-3210 ext 2",
    }));
  it.each(["", "   "])("rejects an empty name %j", (name) =>
    expect(createLeadSchema.safeParse({ name }).success).toBe(false),
  );
  it("rejects excessive names and invalid optional phones", () => {
    expect(createLeadSchema.safeParse({ name: "x".repeat(121) }).success).toBe(
      false,
    );
    expect(
      createLeadSchema.safeParse({ name: "Ana", phone: "hello" }).success,
    ).toBe(false);
  });
  it("accepts an omitted phone", () =>
    expect(createLeadSchema.safeParse({ name: "Ana" }).success).toBe(true));
  it("rejects unknown statuses and empty patches", () => {
    expect(patchLeadSchema.safeParse({ status: "Pending" }).success).toBe(
      false,
    );
    expect(patchLeadSchema.safeParse({}).success).toBe(false);
  });
  it("requires a discussion and an unambiguous timestamp", () => {
    expect(discussionSchema.safeParse({ content: " " }).success).toBe(false);
    expect(
      discussionSchema.safeParse({
        content: "Call",
        followUpAt: "2026-10-16T09:00",
      }).success,
    ).toBe(false);
  });
  it("requires a date when a follow-up time is supplied", () =>
    expect(
      discussionFormSchema.safeParse({
        content: "Call",
        date: "",
        time: "12:30",
      }).success,
    ).toBe(false));
  it("rejects normalized invalid calendar dates", () =>
    expect(
      discussionFormSchema.safeParse({
        content: "Call",
        date: "2026-02-30",
        time: "09:00",
      }).success,
    ).toBe(false));
  it("accepts a date without a time (9 AM default)", () =>
    expect(
      discussionFormSchema.safeParse({
        content: "Call",
        date: "2026-10-17",
        time: "",
      }).success,
    ).toBe(true));
});
describe("local follow-up calendar and pipeline", () => {
  const now = new Date("2026-10-16T00:10:00+05:30");
  it("uses local midnight rather than UTC date", () => {
    expect(isToday("2026-10-15T18:35:00Z", now)).toBe(true);
    expect(isToday("2026-10-15T18:29:59Z", now)).toBe(false);
    expect(isToday("2026-10-16T18:30:00Z", now)).toBe(false);
  });
  it("does not mark a future follow-up today overdue", () =>
    expect(isOverdue("2026-10-16T01:00:00+05:30", now)).toBe(false));
  it("marks past times today and previous days overdue", () => {
    expect(isOverdue("2026-10-16T00:01:00+05:30", now)).toBe(true);
    expect(isOverdue("2026-10-15T00:01:00+05:30", now)).toBe(true);
  });
  it("handles exact now, cleared dates and end of month", () => {
    expect(isOverdue(now.toISOString(), now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
    expect(isToday(null, now)).toBe(false);
    expect(
      isToday(
        "2026-11-01T00:00:00+05:30",
        new Date("2026-10-31T23:59:59+05:30"),
      ),
    ).toBe(false);
  });
  const data = [
    lead("later", "2026-10-17T09:00:00+05:30"),
    lead("today", "2026-10-16T09:00:00+05:30"),
    lead("overdue", "2026-10-15T09:00:00+05:30", "Ethan", "QUALIFIED"),
    lead("none", null, "Priya"),
  ];
  it("pins today and orders other follow-ups chronologically", () => {
    const result = selectLeads(data, "ALL", "", now);
    expect(result.today.map((l) => l.id)).toEqual(["today"]);
    expect(result.others.map((l) => l.id)).toEqual([
      "overdue",
      "later",
      "none",
    ]);
  });
  it("filters by status", () =>
    expect(
      selectLeads(data, "QUALIFIED", "", now).others.map((l) => l.id),
    ).toEqual(["overdue"]));
  it("searches names case-insensitively and combines with status", () => {
    expect(selectLeads(data, "ALL", "  ANANYA ", now).count).toBe(2);
    expect(selectLeads(data, "QUALIFIED", "ananya", now).count).toBe(0);
  });
});
