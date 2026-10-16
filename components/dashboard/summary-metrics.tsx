"use client";
import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, Clock3, TrendingUp, Users } from "lucide-react";
import { isOverdue, isToday } from "@/lib/leads";
import type { Lead } from "@/lib/types";
export function SummaryMetrics({
  data,
  now,
  loading,
  error,
}: {
  data: Lead[];
  now: Date;
  loading: boolean;
  error: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const metrics = [
    {
      title: "Total leads",
      value: data.length,
      icon: Users,
      detail: "Connections in your pipeline",
      color: "indigo",
    },
    {
      title: "Follow-ups today",
      value: data.filter((lead) => isToday(lead.nextFollowUpAt, now)).length,
      icon: CalendarDays,
      detail: "A little attention goes a long way",
      color: "amber",
    },
    {
      title: "Overdue follow-ups",
      value: data.filter((lead) => isOverdue(lead.nextFollowUpAt, now)).length,
      icon: Clock3,
      detail: "Ready for your next move",
      color: "rose",
    },
    {
      title: "Won leads",
      value: data.filter((lead) => lead.status === "WON").length,
      icon: TrendingUp,
      detail: "Relationships turned into results",
      color: "teal",
    },
  ];

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className={`metric-card metric-${metric.color}`}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {metric.title}
            </p>
            <span className="metric-icon">
              <metric.icon size={16} />
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-12 animate-pulse rounded bg-accent" />
          ) : (
            <p className="text-[32px] font-semibold leading-none tracking-[-1px]">
              {error ? "—" : metric.value.toString().padStart(2, "0")}
            </p>
          )}
          <p className="mt-3 hidden text-[11px] text-muted-foreground sm:block">
            {metric.detail}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
