# LeadFlow — submission evidence

Prepared for the PravarAI AI-smart Fullstack Internship assessment on October 16, 2026.

- GitHub: [Vaibhavv2704/leadflow](https://github.com/Vaibhavv2704/leadflow)
- Live application: not deployed. Vercel credentials and a hosted PostgreSQL connection are not configured in this workspace. Exact deployment steps are in [README.md](README.md#production-and-vercel-deployment).
- Demo video: not provided.
- Backend: Next.js Route Handlers, Prisma, and real PostgreSQL. FastAI is not implemented.

## Implemented feature checklist

- [x] One-screen CRM with modal creation and lead details.
- [x] All six required statuses, persisted to PostgreSQL.
- [x] Validated name, optional company, and international phone input.
- [x] Responsive lead rows with company, status, latest note, relative discussion time, and next follow-up.
- [x] Combined case-insensitive name search and status filters.
- [x] Today's follow-ups pinned using the user's local calendar; chronological ordering within sections.
- [x] Red overdue indicators based on timestamps; future times today are not overdue.
- [x] Full newest-first discussion timeline with date, time, and historical scheduled follow-ups.
- [x] Atomic note insertion and lead follow-up update.
- [x] Omitted schedule preserves an existing follow-up; explicit completion clears it.
- [x] Dashboard and detail cache refresh immediately after successful server writes.
- [x] Required JSON APIs, shared Zod validation, consistent 400/404/500 responses, and 201 creation responses.
- [x] Light/dark themes, locally bundled Inter font, subtle Motion animation, and reduced-motion support.
- [x] Accessible Radix/shadcn dialogs, Escape handling, focus restoration, visible focus styles, and labeled form errors.
- [x] Skeletons, retry states, disabled submission controls, success/error toasts, and preserved drafts on failure.
- [x] All specified empty states.
- [x] Indexed normalized schema, checked-in migration, and repeatable seed with eight realistic leads.
- [x] Local PostgreSQL launcher, optional Docker Compose, reproducible lockfile, `.env.example`, and secret exclusions.
- [x] README, API documentation, setup/deployment commands, screenshots, and AI disclosure.

## Executed verification

Final completed runs in this workspace used Node.js 24.19.0 on Windows, a real local PostgreSQL server, and installed Microsoft Edge through Playwright. Unit and database tests ran with the Asia/Kolkata local calendar; browser contexts used Asia/Kolkata.

| Check                               | Executed result                                         |
| ----------------------------------- | ------------------------------------------------------- |
| Strict TypeScript (`tsc --noEmit`)  | Passed, no errors                                       |
| ESLint                              | Passed, no errors or warnings                           |
| Vitest unit + React Testing Library | 21 passed, 0 failed                                     |
| Vitest PostgreSQL integration       | 10 passed, 0 failed                                     |
| Playwright desktop + mobile         | 6 passed, 0 failed                                      |
| Production Next.js build            | Passed                                                  |
| Prisma client generation            | Passed                                                  |
| Development and test migrations     | Applied successfully                                    |
| Frozen-lockfile installation        | Passed                                                  |
| Real PostgreSQL persistence         | Verified by API database assertions and browser refresh |

**Total: 37 automated tests passed. No unresolved test failures.**

Database integration tests cover creation/default status, whitespace validation, malformed JSON/unknown fields, all six persisted statuses, discussions, newest-first history, latest-note dashboard reads, atomic follow-ups, preservation, rescheduling, explicit clearing, missing-lead 404s, and invalid writes leaving data unchanged. Unit tests cover local midnight and month boundaries, exact-now/past/future timestamps, filtering/search combinations, and safe database-failure responses.

Browser tests cover the full customer workflow on desktop and mobile, themes, horizontal overflow, Escape/focus restoration, rejected status writes, failed discussion writes retaining drafts, and dashboard retry after a failed request. Desktop/mobile checks use Chromium-based Edge; they do not claim Safari, Firefox, or screen-reader certification.

Run the documented checks:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm db:test:prepare
pnpm test:integration
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

`db:test:prepare` requires the isolated test database to exist. `pnpm db:local` creates it automatically; Docker users can use the `createdb` command in the README. If using installed Edge, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium. Test suites refuse database names that do not end in `_test`.

## Actual screenshots

Captured by Playwright against seeded database records, with no invented data source or deployment:

- [Desktop light](docs/screenshots/desktop-light.png)
- [Desktop dark](docs/screenshots/desktop-dark.png)
- [Desktop timeline](docs/screenshots/desktop-timeline.png)
- [Mobile light](docs/screenshots/mobile-light.png)
- [Mobile dark](docs/screenshots/mobile-dark.png)
- [Mobile timeline](docs/screenshots/mobile-timeline.png)

## Concise demo checklist

1. Start PostgreSQL, apply migrations, run the seed, and open the dashboard. Show the eight seeded leads and summary metrics.
2. Choose **Qualified** to demonstrate status filtering; return to **All leads**. Search for a name to demonstrate combined filtering.
3. Select **Add new lead**, enter a name/company/phone, and create it. Show its **New** badge.
4. Select the new lead's row to open its timeline dialog.
5. Add a meaningful discussion note and save. Show the new timeline entry.
6. Add another discussion with today's date and a future local time. Save it.
7. Close the dialog and show the new note and pinned follow-up immediately in the dashboard.
8. Reopen the lead, choose **Qualified** or **Proposal Sent**, then close to show its updated badge.
9. Refresh the page and reopen the lead to verify persisted status and both discussion notes.
10. Show today's pinned section, the red overdue examples, and a future follow-up today without an overdue badge. Optionally select **Mark complete** to clear a follow-up.

## Remaining external submission steps

1. Create a hosted PostgreSQL database and configure Vercel environment variables.
2. Import the GitHub repository into Vercel, apply migrations, and deploy with the README commands.
3. Verify the deployed workflow, then record the real live URL here.
4. Record and link a demo video if the assessment submission form requires one.

Authentication is intentionally omitted as permitted by the brief. Use demonstration data when publishing this shared CRM. No live deployment or video has been claimed.
