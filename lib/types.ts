export const statuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const;
export type LeadStatus = (typeof statuses)[number];
export const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
};
export interface Discussion {
  id: string;
  leadId: string;
  content: string;
  followUpAt: string | null;
  createdAt: string;
}
export interface Lead {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  discussions: Discussion[];
}
