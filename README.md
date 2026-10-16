# LeadFlow

A focused, single-screen CRM for meaningful sales relationships. Built for the PravarAI AI-smart Fullstack Internship assessment with a real PostgreSQL backend.

## Features

- Create leads with trimmed, validated names, optional companies, and international phone numbers.
- Manage all six stages: New, Contacted, Qualified, Proposal Sent, Won, and Lost.
- Search names immediately and combine search with status filters without navigation.
- Open accessible dialogs for lead details and creation; no separate detail pages.
- Persist discussion notes and view the full history newest first.
- Schedule, reschedule, or explicitly complete follow-ups. A note without a new schedule preserves the existing one.
- Pin today's follow-ups using the browser's local calendar. Highlight past timestamps in red, including earlier times today, while keeping future times today out of the overdue count.
- Dashboard counts, notes, statuses, and follow-ups refresh after successful mutations. Pending controls prevent duplicate submissions; failures retain drafts and show errors.
- Responsive desktop/mobile layouts, light/dark themes, reduced-motion support, loading skeletons, retry actions, helpful empty states, and toasts.

## Screenshots

Actual Playwright captures, generated against seeded PostgreSQL records:

![Desktop light dashboard](docs/screenshots/desktop-light.png)

Additional captures: [desktop dark](docs/screenshots/desktop-dark.png), [mobile light](docs/screenshots/mobile-light.png), [mobile dark](docs/screenshots/mobile-dark.png), [desktop timeline](docs/screenshots/desktop-timeline.png), [mobile timeline](docs/screenshots/mobile-timeline.png).

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) Button/Dialog components using Radix primitives (registry source with owned LeadFlow styles), Lucide, Motion, TanStack Query, React Hook Form, Zod, date-fns, Prisma 7 with the PostgreSQL driver adapter, and PostgreSQL. Inter is bundled locally with Fontsource, so builds do not fetch fonts.

The backend uses **Next.js Route Handlers**. FastAI is not implemented. Exact resolved dependencies are recorded in `pnpm-lock.yaml`; use frozen-lockfile installation.

## Architecture

```text
app/
  api/leads/route.ts                  # GET and POST
  api/leads/[id]/route.ts             # GET and PATCH
  api/leads/[id]/discussions/route.ts  # POST
  layout.tsx, page.tsx, globals.css
components/
  dashboard/                         # Overview, metrics, filters, rows
  leads/                             # Creation form and status badges
  timeline/                          # Details, timeline and discussion form
  ui/                                # Owned accessible UI primitives
hooks/use-leads.ts                    # Query cache and mutation lifecycle
lib/
  server/                            # Database service and HTTP responses
  validations/                       # Shared Zod input contracts
  leads.ts                           # Pure calendar, filtering and sorting logic
  prisma.ts, types.ts, utils.ts
prisma/
  schema.prisma, migrations/, seed.ts
scripts/local-postgres.mjs
tests/                               # Unit, React, database and browser tests
docs/screenshots/
compose.yaml, playwright.config.ts
README.md, SUBMISSION.md, .env.example
```

Client components call relative REST endpoints. Query invalidation waits for the server write, then refreshes both detail and dashboard caches. There are no speculative optimistic writes to roll back and no mock/localStorage CRM data. Theme preference is the only browser-persisted preference.

`Lead` stores contact fields, enum status, the active follow-up, and audit timestamps. `Discussion` references a lead with a cascading foreign key and stores content, the historical scheduled follow-up, and creation time. Status and follow-up indexes support lead queries; `(leadId, createdAt DESC)` supports timeline reads. The dashboard fetch includes only the latest discussion, while detail fetches the complete ordered history. Creating a note and updating its lead's follow-up run in one transaction; updating the parent first locks the lead row. Timestamps use `TIMESTAMPTZ(3)` and ISO 8601 UTC JSON. Browser inputs convert local date/time into UTC before submission. New records default to `NEW` in PostgreSQL.

## Prerequisites

- Node.js 24 LTS recommended (22.12 or later).
- pnpm 11.25.0: `npm install -g pnpm@11.25.0`.
- PostgreSQL locally, Docker Compose, or a hosted PostgreSQL database.

## Installation

Run all commands from the repository root:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:generate
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred.

### Database options

**Local without Docker:** `pnpm db:local` starts a real PostgreSQL server bound to `127.0.0.1:5432`, creates `leadflow` and `leadflow_test`, and retains data in ignored `.local-postgres/`. Keep that terminal running. This optional development helper packages native PostgreSQL binaries and uses development-only credentials from `.env.example`. Do not run it in production or alongside another server on port 5432.

**Docker:** run `docker compose up -d`. This creates `leadflow` with the credentials in `.env.example` and persists its data in a named volume. To create the isolated test database:

```sh
docker compose exec postgres createdb -U leadflow leadflow_test
```

Run that command once. `docker compose down` stops the server without deleting the data volume.

**Existing/hosted PostgreSQL:** create a database in Neon, Supabase, Prisma Postgres, or your PostgreSQL provider. Copy its PostgreSQL connection URI into `DATABASE_URL` in `.env`. Retain provider-required TLS parameters such as `sslmode=require`. If the provider supplies a pooled runtime URI and a separate direct URI, set `DATABASE_URL` to the pooled URI and `DIRECT_URL` to the direct URI for Prisma migrations. Never commit these values. Production TLS must follow the provider's certificate instructions; the application does not disable certificate verification.

### Migrations, seed, and development

With the database running, in a second terminal:

```sh
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [LeadFlow locally](http://127.0.0.1:3000). Add a lead and refresh to confirm persistence.

The eight sample leads span all statuses and include multiple notes, today's follow-ups, a future follow-up today, overdue records, and unscheduled records. Seed dates are relative to the machine's calendar/timezone; use the same timezone as the demo browser for today's examples. Reseeding updates only stable `seed-*` leads and resets their demonstration notes; other leads remain untouched. The 11:45 PM sample is future until that time, so rerun or adjust the sample if demonstrating late at night.

`pnpm db:migrate` uses checked-in migrations (`prisma migrate deploy`) and does not reset data. For schema development, use `pnpm exec prisma migrate dev --name descriptive_name`, review the SQL, then commit the new migration.

## Tests and verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Unit tests cover validation, status/search combinations, pinning, overdue boundaries, exact-now comparisons, local midnight, month changes, and safe database error responses. React Testing Library tests cover invalid and successful lead creation.

Integration and E2E tests require a **dedicated database whose name ends in `_test`**. They refuse other names. The default is `postgresql://leadflow:leadflow@127.0.0.1:5432/leadflow_test`. They delete only the records they create. To use another server, set `TEST_DATABASE_URL` in the shell or `.env`; configure migrations using that same URI first.

Prepare the dedicated test database, apply migrations, and seed its demonstration records (the helper overrides both database URLs to protect other environments):

```sh
pnpm db:test:prepare
pnpm test:integration
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

If Edge is already installed, skip the browser download and set `PLAYWRIGHT_CHANNEL=msedge` in the shell (`$env:PLAYWRIGHT_CHANNEL='msedge'` in PowerShell). Browser tests start the production app on port 3100 against the test database, exercise creation, validation, notes, scheduling, status, search/filtering, completion, refresh persistence, themes, focus restoration, and overflow at desktop/mobile sizes. They also recreate the six screenshots. Playwright reports and traces remain ignored. Test results actually executed for this submission are recorded in `SUBMISSION.md`.

## Production and Vercel deployment

```sh
pnpm build
pnpm start
```

The build generates Prisma before building Next.js. API routes use Node.js, with a reusable Prisma client and a bounded PostgreSQL connection pool. No absolute API host is hardcoded.

1. Create a hosted PostgreSQL database and save the runtime/direct URLs securely.
2. Push this repository to GitHub and import it in Vercel as a Next.js project.
3. Use Node.js 24 and install command `pnpm install --frozen-lockfile`.
4. Configure `DATABASE_URL` and, when needed, `DIRECT_URL` in Vercel. Use separate databases for preview and production. No `NEXT_PUBLIC_*` database secrets are needed.
5. Apply migrations to the intended production database with `pnpm db:migrate` from a trusted shell/CI job with the production environment configured. Run once per release before serving the new application. Do not run `migrate dev`, `db push`, or resets against production.
6. Set build command to `pnpm build`. Alternatively, for this single-project assessment with a dedicated database, `pnpm db:migrate && pnpm build` applies migrations during deployment. Avoid concurrent migration runners.
7. Deploy, check `/api/leads`, create a record, add a discussion, change status, and refresh. Run the seed only if demonstration data is desired.

No live deployment is claimed. This workspace had no Vercel account credentials or hosted database configured. Do not expose a sensitive dataset publicly: authentication was intentionally omitted for the assessment, so anyone with access to the deployment can read and modify its leads.

## API

All success responses are `{ "data": ... }`. Errors are `{ "error": { "code": "...", "message": "...", "fields": { ... } } }` (fields are supplied for validation failures).

| Method | Path                         | Body / behavior                                                                   |
| ------ | ---------------------------- | --------------------------------------------------------------------------------- |
| GET    | `/api/leads`                 | Dashboard leads and each latest discussion                                        |
| POST   | `/api/leads`                 | `{ name, company?, phone? }`, 201; defaults to New                                |
| GET    | `/api/leads/:id`             | Contact details and full timeline, newest first                                   |
| PATCH  | `/api/leads/:id`             | `{ status?, nextFollowUpAt? }`; ISO timestamp reschedules, explicit `null` clears |
| POST   | `/api/leads/:id/discussions` | `{ content, followUpAt? }`, 201; omitted schedule preserves the active follow-up  |

Status API values: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`. Empty patches, unknown fields, malformed JSON, invalid dates/statuses, and invalid fields return 400. Missing leads return 404. Unexpected database failures return a generic 500; no internal stack trace is sent to clients.

## GitHub publishing

Public repository: [Vaibhavv2704/leadflow](https://github.com/Vaibhavv2704/leadflow). The workspace has incremental commits and an `origin` remote for this repository. For a separate copy where no remote is configured, authenticate to GitHub CLI and publish to a new repository without overwriting another repository:

```sh
gh repo create leadflow --public --source=. --remote=origin --push
```

If GitHub CLI is unavailable, create an empty public `leadflow` repository through GitHub, then:

```sh
git remote add origin https://github.com/YOUR_USERNAME/leadflow.git
git push -u origin HEAD
```

Replace `YOUR_USERNAME` with your account. Update the live deployment URL in `SUBMISSION.md` after deploying. The actual GitHub URL is already recorded.

## Known limits

- Authentication, multi-tenant isolation, lead deletion/editing contact data, pagination, reminder delivery, and audit trails beyond discussions are outside the assessment scope.
- The dashboard loads all leads and updates the clock every 15 seconds and on window focus. This is appropriate for a lightweight CRM; add server pagination for large datasets.
- Follow-up date-only input defaults to 9 AM locally. Dates store the resulting instant, not an IANA timezone. On a daylight-saving fall-back ambiguity, JavaScript chooses the earlier occurrence. Nonexistent spring-forward times are rejected by local form validation.
- Desktop/mobile automated checks use Chromium/Edge; Safari/Firefox and screen-reader review have not been performed.
- The development PostgreSQL launcher is an optional beta package wrapping real PostgreSQL; hosted PostgreSQL or Docker is recommended outside local assessment development.

## AI-assisted development disclosure

OpenAI Codex assisted with architecture, code, UI, tests, documentation, and verification in this workspace. The implementation uses real Route Handlers, Prisma, and PostgreSQL. Executed results and outstanding publication steps are stated in `SUBMISSION.md`. No FastAI implementation, deployment URL, GitHub URL, or video is fabricated.
