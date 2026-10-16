"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@/lib/types";
import type { CreateLeadInput } from "@/lib/validations/leads";
export class ApiError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = await response.json();
  if (!response.ok)
    throw new ApiError(
      json.error?.message || "Something went wrong. Please try again.",
      json.error?.fields,
    );
  return json.data;
}
export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => api<Lead[]>("/api/leads"),
  });
}
export function useLead(id: string | null) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => api<Lead>(`/api/leads/${id}`),
    enabled: !!id,
  });
}
export function useLeadMutations(id?: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["leads"] }),
      client.invalidateQueries({ queryKey: ["lead"] }),
    ]);
  };
  const onError = (error: Error) => toast.error(error.message);
  const create = useMutation({
    mutationFn: (input: CreateLeadInput) =>
      api<Lead>("/api/leads", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => {
      await refresh();
      toast.success("Lead added to your pipeline");
    },
    onError,
  });
  const patch = useMutation({
    mutationFn: (input: {
      status?: LeadStatus;
      nextFollowUpAt?: string | null;
    }) =>
      api<Lead>(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Lead updated");
    },
    onError,
  });
  const discuss = useMutation({
    mutationFn: (input: { content: string; followUpAt?: string }) =>
      api(`/api/leads/${id}/discussions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Discussion saved");
    },
    onError,
  });
  return { create, patch, discuss };
}
