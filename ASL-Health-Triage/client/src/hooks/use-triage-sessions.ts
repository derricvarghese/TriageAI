import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateTriageSessionInput, type UpdateTriageSessionInput } from "@shared/routes";

export interface TriageAnalysisResult {
  assessment: string;
  recommendedUrgency: string;
  followUpActions: string[];
  safetyNotes: string;
}

// Utility to parse and log Zod errors
function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useTriageSessions() {
  return useQuery({
    queryKey: [api.triageSessions.list.path],
    queryFn: async () => {
      const res = await fetch(api.triageSessions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch triage sessions");
      const data = await res.json();
      return parseWithLogging(api.triageSessions.list.responses[200], data, "triageSessions.list");
    },
  });
}

export function useTriageSession(id: number) {
  return useQuery({
    queryKey: [api.triageSessions.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.triageSessions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch triage session");
      const data = await res.json();
      return parseWithLogging(api.triageSessions.get.responses[200], data, "triageSessions.get");
    },
    enabled: !!id,
  });
}

export function useCreateTriageSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTriageSessionInput) => {
      const validated = api.triageSessions.create.input.parse(data);
      const res = await fetch(api.triageSessions.create.path, {
        method: api.triageSessions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = parseWithLogging(api.triageSessions.create.responses[400], responseData, "triageSessions.create error");
          throw new Error(error.message);
        }
        throw new Error("Failed to create triage session");
      }
      return parseWithLogging(api.triageSessions.create.responses[201], responseData, "triageSessions.create success");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.triageSessions.list.path] }),
  });
}

export function useAnalyzeTriage() {
  return useMutation({
    mutationFn: async (data: {
      patientName: string;
      age: number;
      detectedHandSignals: string[];
      faceStatus: string;
      symptomsNotes: string;
    }): Promise<TriageAnalysisResult> => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "AI analysis failed" }));
        throw new Error(err.message || "AI analysis failed");
      }
      return res.json();
    },
  });
}

export interface ChatResponse {
  message: string;
  isAssessment: boolean;
  assessment?: TriageAnalysisResult & { summary?: string };
}

export function useTriageChat() {
  return useMutation({
    mutationFn: async (data: {
      messages: { role: "assistant" | "user"; content: string; timestamp: number }[];
      patientName: string;
      age: number;
      detectedSignals?: string[];
      faceStatus?: string;
      faceDescriptions?: string[];
      facePainLevel?: number;
      faceCriticalIndicators?: string[];
    }): Promise<ChatResponse> => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Chat failed" }));
        throw new Error(err.message || "Chat failed");
      }
      return res.json();
    },
  });
}

export function useUpdateTriageSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateTriageSessionInput) => {
      const validated = api.triageSessions.update.input.parse(updates);
      const url = buildUrl(api.triageSessions.update.path, { id });
      const res = await fetch(url, {
        method: api.triageSessions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error(responseData.message || "Validation failed");
        }
        if (res.status === 404) throw new Error("Session not found");
        throw new Error("Failed to update triage session");
      }
      return parseWithLogging(api.triageSessions.update.responses[200], responseData, "triageSessions.update");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.triageSessions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.triageSessions.get.path, variables.id] });
    },
  });
}
