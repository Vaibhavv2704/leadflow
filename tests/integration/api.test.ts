import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/prisma";
import { GET, POST } from "@/app/api/leads/route";
import { GET as detail, PATCH } from "@/app/api/leads/[id]/route";
import { POST as discussion } from "@/app/api/leads/[id]/discussions/route";
let id: string;
const ids: string[] = [];
const request = (data: unknown, method = "POST") =>
  new Request("http://localhost/api/leads", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
const context = (value = id) => ({ params: Promise.resolve({ id: value }) });
beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (!url.pathname.endsWith("_test"))
    throw new Error(
      "Integration tests require a dedicated database whose name ends in _test.",
    );
  await db().$connect();
});
afterAll(async () => {
  if (ids.length) await db().lead.deleteMany({ where: { id: { in: ids } } });
  await db().$disconnect();
});
describe("real PostgreSQL route handlers", () => {
  it("creates a persisted lead with New status", async () => {
    const response = await POST(
      request({ name: "  Integration Lead  ", phone: "+91 12345 67890" }),
    );
    expect(response.status).toBe(201);
    const { data } = await response.json();
    id = data.id;
    ids.push(id);
    expect(data.name).toBe("Integration Lead");
    expect(data.status).toBe("NEW");
    expect((await db().lead.findUnique({ where: { id } }))?.name).toBe(
      "Integration Lead",
    );
  });
  it("rejects missing and whitespace names", async () => {
    expect((await POST(request({}))).status).toBe(400);
    expect((await POST(request({ name: " " }))).status).toBe(400);
  });
  it("rejects malformed JSON, unknown fields, and invalid patch data", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost", { method: "POST", body: "{" }),
        )
      ).status,
    ).toBe(400);
    expect((await POST(request({ name: "Test", status: "WON" }))).status).toBe(
      400,
    );
    expect(
      (await PATCH(request({ status: "BOGUS" }, "PATCH"), context())).status,
    ).toBe(400);
  });
  it("persists all six statuses", async () => {
    for (const status of [
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "WON",
      "LOST",
      "NEW",
    ]) {
      const result = await PATCH(request({ status }, "PATCH"), context());
      expect(result.status).toBe(200);
      expect((await result.json()).data.status).toBe(status);
      expect((await db().lead.findUnique({ where: { id } }))?.status).toBe(
        status,
      );
    }
  });
  it("persists a discussion and atomically sets follow-up", async () => {
    const date = "2026-11-01T10:30:00Z";
    const response = await discussion(
      request({ content: " First discussion ", followUpAt: date }),
      context(),
    );
    expect(response.status).toBe(201);
    expect((await response.json()).data.content).toBe("First discussion");
    expect(
      (
        await db().lead.findUnique({ where: { id } })
      )?.nextFollowUpAt?.toISOString(),
    ).toBe("2026-11-01T10:30:00.000Z");
  });
  it("preserves follow-up without a newly supplied date", async () => {
    expect(
      (await discussion(request({ content: "Second discussion" }), context()))
        .status,
    ).toBe(201);
    const lead = await db().lead.findUnique({ where: { id } });
    expect(lead?.nextFollowUpAt?.toISOString()).toBe(
      "2026-11-01T10:30:00.000Z",
    );
  });
  it("returns timeline newest first and latest note on dashboard", async () => {
    const response = await detail(new Request("http://localhost"), context());
    const { data } = await response.json();
    expect(
      data.discussions.map((note: { content: string }) => note.content),
    ).toEqual(["Second discussion", "First discussion"]);
    const { data: leads } = await (await GET()).json();
    expect(
      leads.find((lead: { id: string }) => lead.id === id).discussions,
    ).toHaveLength(1);
    expect(
      leads.find((lead: { id: string }) => lead.id === id).discussions[0]
        .content,
    ).toBe("Second discussion");
  });
  it("reschedules and explicitly clears a follow-up", async () => {
    const response = await PATCH(
      request({ nextFollowUpAt: "2026-12-01T11:00:00+05:30" }, "PATCH"),
      context(),
    );
    expect((await response.json()).data.nextFollowUpAt).toBe(
      "2026-12-01T05:30:00.000Z",
    );
    await PATCH(request({ nextFollowUpAt: null }, "PATCH"), context());
    expect(
      (await db().lead.findUnique({ where: { id } }))?.nextFollowUpAt,
    ).toBeNull();
  });
  it("returns 404 for missing leads without orphan discussions", async () => {
    const missing = context("missing-lead");
    expect(
      (await detail(new Request("http://localhost"), missing)).status,
    ).toBe(404);
    expect(
      (await PATCH(request({ status: "WON" }, "PATCH"), missing)).status,
    ).toBe(404);
    expect(
      (await discussion(request({ content: "No orphan" }), missing)).status,
    ).toBe(404);
    expect(
      await db().discussion.count({ where: { leadId: "missing-lead" } }),
    ).toBe(0);
  });
  it("rejects invalid discussions and leaves the lead untouched", async () => {
    const before = await db().lead.findUnique({ where: { id } });
    expect(
      (
        await discussion(
          request({ content: " ", followUpAt: "tomorrow" }),
          context(),
        )
      ).status,
    ).toBe(400);
    expect((await db().lead.findUnique({ where: { id } }))?.updatedAt).toEqual(
      before?.updatedAt,
    );
  });
});
