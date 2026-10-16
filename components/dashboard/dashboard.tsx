"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  LayoutGrid,
  ListFilter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  X,
  AlertCircle,
} from "lucide-react";
import { useLeads } from "@/hooks/use-leads";
import { selectLeads } from "@/lib/leads";
import { statuses, statusLabels, type LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { LeadDialog } from "@/components/timeline/lead-dialog";
import { Header } from "./header";
import { SummaryMetrics } from "./summary-metrics";
import { LeadRow } from "./lead-row";
export function Dashboard() {
  const leads = useLeads();
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  const data = leads.data ?? [];
  const clock = now ?? new Date(0);
  const result = selectLeads(data, status, search, clock);
  const loading = leads.isPending || !now;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="page-width pb-10 pt-7 sm:pt-10">
        <div className="mb-7 flex items-center gap-2 text-[11px] text-muted-foreground">
          <LayoutGrid size={13} />
          <span>Workspace</span>
          <ChevronRight size={12} />
          <span className="text-foreground">Lead overview</span>
        </div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              YOUR RELATIONSHIP HQ
            </p>
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-1.2px] sm:text-4xl">
              Good things start with a conversation
              <span className="text-primary">.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Keep your connections close and your next steps clear.
            </p>
          </div>
          <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen}>
            <Button className="h-11 px-5">
              <Plus size={17} />
              Add new lead
            </Button>
          </CreateLeadDialog>
        </div>
        <SummaryMetrics
          data={data}
          now={clock}
          loading={loading}
          error={leads.isError}
        />
        <section className="workspace-panel" aria-labelledby="pipeline-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5 pt-6 sm:px-6">
            <div className="flex items-center gap-2.5">
              <h2
                id="pipeline-heading"
                className="text-base font-semibold tracking-tight"
              >
                Your pipeline
              </h2>
              <span className="count-badge">{data.length}</span>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays size={13} />
              {now ? format(now, "EEEE, MMMM d") : "Your local date"}
            </span>
          </div>
          <div className="flex flex-col-reverse justify-between gap-4 px-5 pb-5 sm:px-6 lg:flex-row lg:items-center">
            <div
              className="filter-tabs"
              role="group"
              aria-label="Filter leads by status"
            >
              {(["ALL", ...statuses] as const).map((item) => (
                <button
                  key={item}
                  aria-pressed={status === item}
                  onClick={() => setStatus(item)}
                  className={
                    status === item ? "filter-tab active" : "filter-tab"
                  }
                >
                  {item === "ALL" ? "All leads" : statusLabels[item]}
                  {status === item && (
                    <span>
                      {item === "ALL"
                        ? data.length
                        : data.filter((lead) => lead.status === item).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative min-w-52 lg:w-60">
              <Search
                className="absolute left-3 top-3 text-muted-foreground"
                size={15}
              />
              <label htmlFor="search-leads" className="sr-only">
                Search leads by name
              </label>
              <input
                id="search-leads"
                className="input h-10 pl-9 pr-8 text-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads by name…"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div
              className="px-6 pb-6"
              aria-label="Loading leads"
              aria-busy="true"
            >
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="my-3 h-20 animate-pulse rounded-xl bg-accent"
                />
              ))}
            </div>
          ) : leads.isError ? (
            <div role="alert" className="empty-state">
              <AlertCircle className="text-destructive" size={30} />
              <h3>We couldn’t load your pipeline.</h3>
              <p>
                {leads.error.message} Check your database configuration and
                retry.
              </p>
              <Button
                variant="outline"
                onClick={() => leads.refetch()}
                disabled={leads.isFetching}
              >
                {leads.isFetching && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Try again
              </Button>
            </div>
          ) : !data.length ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={25} />
              </div>
              <h3>Your next opportunity starts here.</h3>
              <p>
                Add your first lead to keep conversations and follow-ups in one
                place.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={15} />
                Add your first lead
              </Button>
            </div>
          ) : (
            <>
              <div className="section-label">
                <span className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary">
                    <Target size={12} />
                  </span>
                  TODAY’S FOLLOW-UPS{" "}
                  <span className="count-badge">{result.today.length}</span>
                </span>
                <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                  A little focus. A lot of possibility.
                </span>
              </div>
              {result.today.length ? (
                <div>
                  {result.today.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      now={clock}
                      onOpen={() => setSelectedId(lead.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-6 py-5 text-xs text-muted-foreground">
                  <Check size={14} className="text-emerald-600" />
                  {status !== "ALL" || search
                    ? "No follow-ups today match these filters."
                    : "No follow-ups today. You’re all caught up."}
                </div>
              )}
              <div className="section-label border-t border-border">
                <span className="flex items-center gap-2">
                  <ListFilter size={13} />
                  {status === "ALL"
                    ? "ALL OTHER LEADS"
                    : `${statusLabels[status].toUpperCase()} LEADS`}{" "}
                  <span className="count-badge">{result.others.length}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                  <ArrowDownWideNarrow size={12} />
                  Next follow-up
                </span>
              </div>
              {!!result.others.length && (
                <div className="table-heading">
                  <span>LEAD / COMPANY</span>
                  <span>STATUS</span>
                  <span>LATEST CONVERSATION</span>
                  <span>NEXT FOLLOW-UP</span>
                </div>
              )}
              {result.others.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  now={clock}
                  onOpen={() => setSelectedId(lead.id)}
                />
              ))}
              {!result.count && (
                <div className="empty-state">
                  <Search size={28} className="text-muted-foreground" />
                  <h3>
                    {search ? "No leads found." : "No leads in this stage yet."}
                  </h3>
                  <p>
                    {search
                      ? `No names match “${search}”. Try another name or clear your filters.`
                      : "As your relationships progress, you’ll find them here."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus("ALL");
                      setSearch("");
                    }}
                  >
                    Clear filters
                    <ArrowRight size={14} />
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4 text-[11px] text-muted-foreground">
                <span aria-live="polite">
                  Showing {result.count} of {data.length} leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Saved to your workspace
                </span>
              </div>
            </>
          )}
        </section>
        <aside className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/[.035] px-5 py-4">
          <div className="flex items-center gap-3">
            <Sparkles size={17} className="text-primary" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Small follow-ups. Strong relationships.
              </span>
              <span className="hidden sm:inline">
                {" "}
                A thoughtful check-in can make all the difference.
              </span>
            </p>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
            Keep the momentum
          </span>
        </aside>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>Made for meaningful connections.</span>
          <button
            className="flex items-center gap-1.5 hover:text-primary"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
          >
            <CircleHelp size={13} />
            How LeadFlow works
          </button>
        </footer>
        {help && (
          <div className="mt-3 rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            Add a lead, then select their row to view the timeline, add notes,
            change their status, or complete a follow-up. Today’s follow-ups
            stay pinned above the rest. Red dates are past due. All scheduling
            uses your local time.
          </div>
        )}
      </main>
      <LeadDialog id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
