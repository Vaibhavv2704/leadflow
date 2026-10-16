// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
const mutate = vi.fn();
vi.mock("@/hooks/use-leads", () => ({
  ApiError: class extends Error {},
  useLeadMutations: () => ({
    create: { mutateAsync: mutate, isPending: false, isError: false },
  }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("accessible lead creation form", () => {
  it("prevents empty submission and shows a field error", async () => {
    const user = userEvent.setup();
    render(
      <CreateLeadDialog open onOpenChange={() => {}}>
        <button>Add</button>
      </CreateLeadDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Create lead" }));
    expect(await screen.findByText("Please enter a full name.")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });
  it("submits trimmed input and closes only after persistence", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    mutate.mockResolvedValue({ id: "new-lead" });
    render(
      <CreateLeadDialog open onOpenChange={close}>
        <button>Add</button>
      </CreateLeadDialog>,
    );
    await user.type(screen.getByLabelText(/Full name/), "  Ananya  ");
    await user.click(screen.getByRole("button", { name: "Create lead" }));
    expect(mutate).toHaveBeenCalledWith({
      name: "Ananya",
      company: "",
      phone: "",
    });
    expect(close).toHaveBeenCalledWith(false);
  });
});
