import { db } from "@/lib/prisma";
import {
  createLeadSchema,
  discussionSchema,
  patchLeadSchema,
} from "@/lib/validations/leads";
import type { z } from "zod";
const latest = {
  discussions: {
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take: 1,
  },
};
export const leadService = {
  list: () =>
    db().lead.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      include: latest,
    }),
  create: (input: z.output<typeof createLeadSchema>) =>
    db().lead.create({ data: input, include: latest }),
  detail: (id: string) =>
    db().lead.findUnique({
      where: { id },
      include: {
        discussions: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
      },
    }),
  patch: (id: string, input: z.output<typeof patchLeadSchema>) =>
    db().lead.update({ where: { id }, data: input, include: latest }),
  addDiscussion: (id: string, input: z.output<typeof discussionSchema>) =>
    db().$transaction(async (tx) => {
      // The lead update acquires a row lock before inserting the note. Missing leads fail atomically.
      await tx.lead.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(input.followUpAt !== undefined
            ? { nextFollowUpAt: new Date(input.followUpAt) }
            : {}),
        },
      });
      return tx.discussion.create({
        data: {
          leadId: id,
          content: input.content,
          ...(input.followUpAt
            ? { followUpAt: new Date(input.followUpAt) }
            : {}),
        },
      });
    }),
};
