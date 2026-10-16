import type { Lead, LeadStatus } from "@/lib/types";
export function isToday(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
export function isOverdue(value: string | null, now: Date) { return !!value && new Date(value).getTime() < now.getTime(); }
export function selectLeads(leads: Lead[], status: LeadStatus | "ALL", search: string, now: Date) {
  const filtered = leads.filter(lead => (status === "ALL" || lead.status === status) && lead.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const sort = (a: Lead, b: Lead) => {
    const aDue = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : Infinity;
    const bDue = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : Infinity;
    return (aDue === bDue ? 0 : aDue - bDue) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() || a.id.localeCompare(b.id);
  };
  return { today: filtered.filter(lead => isToday(lead.nextFollowUpAt, now)).sort(sort), others: filtered.filter(lead => !isToday(lead.nextFollowUpAt, now)).sort(sort), count: filtered.length };
}
