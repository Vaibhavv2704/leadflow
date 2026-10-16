import "dotenv/config";
import { createPrismaClient } from "../lib/prisma";
const prisma = createPrismaClient();
const now = new Date();
const today = (hour: number, minute = 0) => {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date;
};
const days = (offset: number, hour = 10) => {
  const date = today(hour);
  date.setDate(date.getDate() + offset);
  return date;
};
const leads = [
  {
    id: "seed-ananya",
    name: "Ananya Sharma",
    company: "Lumio Studio",
    phone: "+91 98765 43210",
    status: "QUALIFIED" as const,
    follow: today(23, 45),
    notes: [
      "Loved the workflow demo. Exploring a rollout for their 12-person team.",
      "Discovery call: looking to bring their client operations into one workspace.",
    ],
  },
  {
    id: "seed-ethan",
    name: "Ethan Brooks",
    company: "Northstar Labs",
    phone: "+1 (415) 555-0128",
    status: "PROPOSAL_SENT" as const,
    follow: today(9, 30),
    notes: [
      "Sent the tailored proposal. Reviewing with their co-founder this week.",
      "Walked through the annual plan and onboarding timeline.",
    ],
  },
  {
    id: "seed-priya",
    name: "Priya Mehta",
    company: "Bloom & Co.",
    phone: "+91 99887 76655",
    status: "CONTACTED" as const,
    follow: days(-1, 15),
    notes: [
      "Interested in automating their inbound lead process. Send a quick recap.",
    ],
  },
  {
    id: "seed-oliver",
    name: "Oliver Chen",
    company: "Forma Design",
    phone: null,
    status: "NEW" as const,
    follow: null,
    notes: [],
  },
  {
    id: "seed-sarah",
    name: "Sarah Mitchell",
    company: "Evergreen Ventures",
    phone: "+44 20 7946 0123",
    status: "WON" as const,
    follow: null,
    notes: [
      "Contract signed! Kickoff booked for next week. Excited to get started.",
      "Procurement approved the final terms.",
      "Initial discovery: strong fit with our collaboration features.",
    ],
  },
  {
    id: "seed-arjun",
    name: "Arjun Patel",
    company: "Parallel Systems",
    phone: "+91 91234 56789",
    status: "QUALIFIED" as const,
    follow: days(1, 11),
    notes: [
      "Technical review went well. Scheduling a deeper integration walkthrough.",
    ],
  },
  {
    id: "seed-emily",
    name: "Emily Walker",
    company: "Kindred Collective",
    phone: null,
    status: "CONTACTED" as const,
    follow: days(3, 14),
    notes: [
      "Had a great first conversation. Following up after their planning session.",
    ],
  },
  {
    id: "seed-daniel",
    name: "Daniel Kim",
    company: "Apex Digital",
    phone: null,
    status: "LOST" as const,
    follow: null,
    notes: [
      "Timing isn’t right for this quarter. Keep the door open for next year.",
    ],
  },
];
async function main() {
  await prisma.$transaction(async (tx) => {
    for (const lead of leads) {
      // Stable IDs make repeat seeding safe. Only these demonstration records are refreshed.
      await tx.lead.upsert({
        where: { id: lead.id },
        create: {
          id: lead.id,
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          status: lead.status,
          nextFollowUpAt: lead.follow,
        },
        update: {
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          status: lead.status,
          nextFollowUpAt: lead.follow,
        },
      });
      await tx.discussion.deleteMany({ where: { leadId: lead.id } });
      for (const [index, content] of lead.notes.entries())
        await tx.discussion.create({
          data: {
            id: `${lead.id}-note-${index}`,
            leadId: lead.id,
            content,
            followUpAt: index === 0 ? lead.follow : null,
            createdAt: new Date(
              now.getTime() -
                (index * 48 + leads.indexOf(lead) * 3 + 1) * 3600000,
            ),
          },
        });
    }
  });
  console.log(
    `Seeded ${leads.length} demonstration leads. Seed timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
