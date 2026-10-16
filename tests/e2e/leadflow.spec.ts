import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createPrismaClient } from "../../lib/prisma";
test("failed requests show retry feedback and preserve discussion drafts", async ({
  page,
}) => {
  await page.route("**/api/leads", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({
        status: 500,
        json: {
          error: {
            code: "SERVER_ERROR",
            message: "Temporary database outage.",
          },
        },
      });
    else await route.continue();
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "We couldn’t load your pipeline." }),
  ).toBeVisible();
  await page.unroute("**/api/leads");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Ananya Sharma", exact: true })
    .click();
  await expect(page.getByLabel("Lead status", { exact: true })).toHaveValue(
    "QUALIFIED",
  );
  await page.route("**/api/leads/seed-ananya", async (route) => {
    if (route.request().method() === "PATCH")
      await route.fulfill({
        status: 500,
        json: {
          error: {
            code: "SERVER_ERROR",
            message: "Status could not be saved.",
          },
        },
      });
    else await route.continue();
  });
  await page.getByLabel("Lead status", { exact: true }).selectOption("WON");
  await expect(page.getByText("Status could not be saved.")).toBeVisible();
  await expect(page.getByLabel("Lead status", { exact: true })).toHaveValue(
    "QUALIFIED",
  );
  await page.route("**/api/leads/seed-ananya/discussions", (route) =>
    route.fulfill({
      status: 500,
      json: {
        error: {
          code: "SERVER_ERROR",
          message: "Discussion could not be saved.",
        },
      },
    }),
  );
  await page
    .getByLabel("Add a discussion")
    .fill("Keep this unsaved draft for retry.");
  await page.getByRole("button", { name: "Save discussion" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "Discussion could not be saved.",
  );
  await expect(page.getByLabel("Add a discussion")).toHaveValue(
    "Keep this unsaved draft for retry.",
  );
  await expect(page.getByRole("dialog").locator("ol li")).toHaveCount(2);
});
test("create, discuss, schedule, change status, and retain after refresh", async ({
  page,
}, testInfo) => {
  const name = `E2E ${testInfo.project.name} ${Date.now()}`;
  const prisma = createPrismaClient();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your pipeline" }),
    ).toBeVisible();
    await expect(page.getByLabel("Loading leads")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Add new lead", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Create lead", exact: true })
      .click();
    await expect(page.getByText("Please enter a full name.")).toBeVisible();
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Company (optional)").fill("Assessment Studio");
    await page.getByLabel("Phone number (optional)").fill("+91 98765 43210");
    await page
      .getByRole("button", { name: "Create lead", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByLabel("Search leads by name").fill(name.toLowerCase());
    const row = page.getByRole("button", { name: `Open ${name}`, exact: true });
    await expect(row).toBeVisible();
    await expect(row.getByText("New", { exact: true })).toBeVisible();
    await row.click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Add a discussion")
      .fill("E2E first conversation: schedule a follow-up.");
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await page.getByLabel("Follow-up date", { exact: true }).fill(today);
    await page.getByLabel("Follow-up time", { exact: true }).fill("23:59");
    await page.getByRole("button", { name: "Save discussion" }).click();
    await expect(
      page
        .getByRole("dialog")
        .getByText("E2E first conversation: schedule a follow-up.", {
          exact: true,
        }),
    ).toBeVisible();
    await page
      .getByLabel("Lead status", { exact: true })
      .selectOption("QUALIFIED");
    await expect(page.getByLabel("Lead status", { exact: true })).toHaveValue(
      "QUALIFIED",
    );
    await page
      .getByLabel("Add a discussion")
      .fill("E2E second conversation: existing schedule preserved.");
    await page.getByRole("button", { name: "Save discussion" }).click();
    await expect(
      page
        .getByRole("dialog")
        .getByText("E2E second conversation: existing schedule preserved.", {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark complete" }),
    ).toBeVisible();
    const notes = page
      .getByRole("dialog")
      .locator("ol li p.whitespace-pre-wrap");
    await expect(notes.first()).toHaveText(
      "E2E second conversation: existing schedule preserved.",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(row).toContainText("Qualified");
    await expect(row).toContainText("E2E second conversation");
    await expect(row).toContainText("Today");
    await expect(row).not.toContainText("Overdue");
    await page.reload();
    await page.getByLabel("Search leads by name").fill(name);
    await expect(row).toContainText("Qualified");
    await row.click();
    await expect(page.getByRole("dialog").locator("ol li")).toHaveCount(2);
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(
      page.getByText("No follow-up scheduled", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("group", { name: "Filter leads by status" })
      .getByRole("button", { name: "Won" })
      .click();
    await expect(row).toHaveCount(0);
    await expect(page.getByText("No leads found.")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await prisma.lead.deleteMany({ where: { name } });
    await prisma.$disconnect();
  }
});
test("responsive themes, dialog accessibility, and screenshots", async ({
  page,
}, testInfo) => {
  await mkdir("docs/screenshots", { recursive: true });
  await page.goto("/");
  await expect(page.getByLabel("Loading leads")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Ananya Sharma", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".metric-card").first().locator("..")).toHaveCSS(
    "opacity",
    "1",
  );
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-light.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-dark.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Open Ananya Sharma", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Ananya Sharma", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: /Discussion history/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-timeline.png`,
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Ananya Sharma", exact: true }),
  ).toBeFocused();
});
