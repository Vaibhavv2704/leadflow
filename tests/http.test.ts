import { describe, expect, it, vi, afterEach } from "vitest";
import { POST, GET } from "@/app/api/leads/route";
import { leadService } from "@/lib/server/lead-service";
vi.mock("@/lib/server/lead-service", () => ({
  leadService: { create: vi.fn(), list: vi.fn() },
}));
afterEach(() => vi.restoreAllMocks());
describe("database failure responses", () => {
  it("does not report success when creation fails and hides internal errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(leadService.create).mockRejectedValue(
      new Error("postgres://secret-credential internal stack"),
    );
    const response = await POST(
      new Request("http://localhost/api/leads", {
        method: "POST",
        body: JSON.stringify({ name: "Ana" }),
      }),
    );
    expect(response.status).toBe(500);
    expect(await response.text()).not.toMatch(
      /secret-credential|internal stack/,
    );
  });
  it("returns a safe server error when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(leadService.list).mockRejectedValue(new Error("DB unavailable"));
    const response = await GET();
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("SERVER_ERROR");
  });
});
