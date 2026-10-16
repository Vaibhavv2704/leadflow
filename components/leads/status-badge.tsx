import { statusLabels, type LeadStatus } from "@/lib/types";
export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}
