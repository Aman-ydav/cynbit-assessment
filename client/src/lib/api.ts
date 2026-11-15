import type {
  AdminLead,
  AdminStats,
  Answers,
  ClientEventName,
  LeadInput,
  Plan,
} from "@bitelevate/shared";

/** A failed API call. `status` 0 means the network itself failed (offline, server down). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly issues?: { path: string; message: string }[],
  ) {
    super(message ?? code);
  }

  /** The server is unreachable or erroring — as opposed to rejecting the request. */
  get isUnavailable() {
    return this.status === 0 || this.status >= 500;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "network", "Could not reach the server.");
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      String(body?.error ?? "error"),
      typeof body?.message === "string" ? body.message : undefined,
      Array.isArray(body?.issues) ? (body.issues as { path: string; message: string }[]) : undefined,
    );
  }
  return body as T;
}

export interface PlanResponse {
  code: string;
  plan: Plan;
}

export interface LeadResponse {
  ok: true;
  deleteToken: string;
  emailSent: boolean;
}

export const api = {
  createPlan: (answers: Answers, sessionId: string) =>
    request<PlanResponse>("/plans", { method: "POST", body: JSON.stringify({ answers, sessionId }) }),

  getPlan: (code: string) => request<PlanResponse>(`/plans/${encodeURIComponent(code)}`),

  getConfig: () => request<{ emailEnabled: boolean }>("/config"),

  createLead: (lead: LeadInput) =>
    request<LeadResponse>("/leads", { method: "POST", body: JSON.stringify(lead) }),

  deleteLead: (token: string) => request<void>(`/leads/${encodeURIComponent(token)}`, { method: "DELETE" }),

  adminLogin: (password: string) =>
    request<{ ok: true }>("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),

  adminLogout: () => request<void>("/admin/logout", { method: "POST" }),

  adminMe: () => request<{ authenticated: boolean }>("/admin/me"),

  adminStats: () => request<AdminStats>("/admin/stats"),

  adminLeads: () => request<{ leads: AdminLead[] }>("/admin/leads?limit=200"),

  sendEvent: (body: { sessionId: string; name: ClientEventName; props?: Record<string, string | number | boolean> }) =>
    request<void>("/events", { method: "POST", body: JSON.stringify(body), keepalive: true }),
};
