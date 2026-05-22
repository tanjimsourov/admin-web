import { API_BASE_URL } from "../config/backend";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function getCsrfToken(): string | null {
  // Backend can expose either Django default or custom cookie name.
  return getCookie("wb_csrftoken") || getCookie("csrftoken");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const requestId = response.headers.get("X-Request-ID") || error.request_id || "";
    const detail = error.detail || error.message || `Request failed: ${response.status}`;
    throw new Error(requestId ? `${detail} (request ${requestId})` : detail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

// Auth
export interface AuthStatus {
  authenticated: boolean;
  has_users: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    is_superuser: boolean;
  };
}

export interface BootstrapPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  bootstrap_token: string;
}

export const authApi = {
  status: () => api.get<AuthStatus>("/auth/status/"),
  login: (username: string, password: string) =>
    api.post<AuthStatus>("/auth/login/", { username, password }),
  bootstrap: (payload: BootstrapPayload) =>
    api.post<AuthStatus>("/auth/bootstrap/", payload),
  logout: () => api.post("/auth/logout/"),
};

// Platform Admin
export interface PlatformMetrics {
  total_users: number;
  active_users_30d: number;
  total_workspaces: number;
  total_sites: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: string;
  subscriptions_active: number;
  subscriptions_trialing: number;
  subscriptions_past_due: number;
  mrr: string;
  active_offers: number;
  sent_campaigns: number;
}

export interface PlatformUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  account_status?: string | null;
  support_agent?: boolean;
  mfa_enabled?: boolean;
  email_verified?: boolean;
  date_joined: string;
  last_login: string | null;
  workspace_count: number;
  site_count: number;
  order_count: number;
  package?: string;
  user_category?: string;
  site_limit?: number | null;
  contact_required?: boolean;
}

export interface PlatformUserCreatePayload {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  package?: string;
  is_active?: boolean;
  create_workspace?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PlatformAccountRequest {
  id: number;
  user_id: number;
  username: string;
  email: string;
  user_email: string;
  display_name: string;
  status: string;
  marketing_opt_in: boolean;
  package: string;
  user_category: string;
  site_limit?: number | null;
  contact_required?: boolean;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by_username: string | null;
  rejected_at: string | null;
  rejected_by_username: string | null;
  rejection_reason: string;
}

export interface PlatformWorkspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  plan_tier?: string;
  is_personal?: boolean;
  owner_username: string;
  owner_email: string;
  member_count: number;
  site_count: number;
  created_at: string;
  updated_at?: string;
  subscription?: PlatformSubscription | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
}

export interface PlatformOrder {
  id: number;
  order_number: string;
  site_name: string;
  total: string;
  payment_status: string;
  placed_at: string;
}

export interface PlatformOverview {
  metrics: PlatformMetrics;
  recent_users: PlatformUser[];
  recent_workspaces: PlatformWorkspace[];
  recent_orders: PlatformOrder[];
}

export interface PlatformSubscription {
  id: number;
  workspace: number;
  workspace_name?: string;
  owner_username?: string;
  plan: string;
  status: string;
  billing_cycle: string;
  seats: number;
  monthly_recurring_revenue: string;
  started_at: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  notes: string;
}

export interface PlatformOffer {
  id: number;
  name: string;
  code: string;
  headline: string;
  description: string;
  offer_type: string;
  target_plan: string;
  discount_value: string;
  duration_in_months: number;
  seats_delta: number;
  cta_url: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_by_username?: string | null;
  created_at?: string;
}

export interface PlatformCampaign {
  id: number;
  name: string;
  subject: string;
  preview_text: string;
  body_text: string;
  body_html: string;
  audience_type: string;
  status: string;
  offer: number | null;
  offer_name?: string | null;
  recipient_count: number;
  sent_count: number;
  last_error: string;
  sent_at: string | null;
  created_at: string;
}

export interface PlatformBillingWorkspaceSnapshot {
  workspace_id: number;
  workspace_slug: string;
  workspace_name: string;
  plan_tier: string;
  billing_plan: string;
  billing_status: string;
  billing_cycle: string;
  mrr: string;
  seats: number;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
}

export interface PlatformBillingSummary {
  summary: {
    workspace_count: number;
    total_mrr: string;
    lifetime_paid_revenue: string;
    billing_status_counts: Record<string, number>;
  };
  results: PlatformBillingWorkspaceSnapshot[];
}

export interface PlatformIntegrationStatus {
  summary: {
    total: number;
    installed: number;
    suspended: number;
    disabled: number;
    error: number;
    health_pending: number;
    health_healthy: number;
    health_degraded: number;
    health_error: number;
  };
  results: Array<{
    id: number;
    app_slug: string;
    app_name: string;
    workspace_slug: string;
    site_slug: string;
    status: string;
    health_status: string;
    last_error: string;
  }>;
}

export interface PlatformOperationsSummary {
  generated_at: string;
  window_hours: number;
  status: string;
  dependencies: { status?: string; checks?: Record<string, unknown> };
  integrations: Record<string, number>;
  jobs: Record<string, number>;
  webhooks: Record<string, number>;
  ai: Record<string, number | Record<string, number>>;
}

export const platformAdminApi = {
  overview: () => api.get<PlatformOverview>("/platform-admin/overview/"),
  users: (query?: string) =>
    api.get<PlatformUser[]>(`/platform-admin/users/${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  createUser: (data: PlatformUserCreatePayload) =>
    api.post<PlatformUser>("/platform-admin/users/", data),
  workspaces: (query?: string) =>
    api.get<PlatformWorkspace[]>(`/platform-admin/workspaces/${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  activateUser: (userId: number, reason = "Activated from owner console") =>
    api.post<{ id: number; is_active: boolean }>(`/platform-admin/users/${userId}/activate/`, { reason }),
  deactivateUser: (userId: number, reason = "Suspended from owner console") =>
    api.post<{ id: number; is_active: boolean }>(`/platform-admin/users/${userId}/deactivate/`, { reason }),
  lockUser: (userId: number, reason = "Locked from owner console") =>
    api.post<{ id: number; status: string }>(`/platform-admin/users/${userId}/lock/`, { reason }),
  unlockUser: (userId: number, reason = "Unlocked from owner console") =>
    api.post<{ id: number; status: string }>(`/platform-admin/users/${userId}/unlock/`, { reason }),
  updateUserPackage: (userId: number, packageId: string) =>
    api.post<PlatformUser>(`/platform-admin/users/${userId}/package/`, { package: packageId }),
  accountRequests: (status = "pending", query?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return api.get<PaginatedResponse<PlatformAccountRequest>>(`/platform-admin/accounts/${suffix}`);
  },
  approveAccount: (userId: number) =>
    api.post<{ detail: string; code: string }>(`/platform-admin/accounts/${userId}/approve/`),
  rejectAccount: (userId: number, reason = "Rejected from owner console") =>
    api.post<{ detail: string; code: string }>(`/platform-admin/accounts/${userId}/reject/`, { reason }),
  billingSummary: (limit = 50) =>
    api.get<PlatformBillingSummary>(`/platform-admin/billing/summary/?limit=${limit}`),
  integrationStatus: () =>
    api.get<PlatformIntegrationStatus>("/platform-admin/integrations/status/"),
  operationsSummary: () =>
    api.get<PlatformOperationsSummary>("/platform-admin/operations/summary/"),

  // Subscriptions
  subscriptions: () => api.get<PlatformSubscription[]>("/platform-subscriptions/"),
  pauseSubscription: (id: number, reason = "Paused from owner console") =>
    api.post<PlatformSubscription>(`/platform-subscriptions/${id}/pause/`, { reason }),
  resumeSubscription: (id: number, reason = "Resumed from owner console") =>
    api.post<PlatformSubscription>(`/platform-subscriptions/${id}/resume/`, { reason }),

  // Offers
  offers: () => api.get<PlatformOffer[]>("/platform-offers/"),
  createOffer: (data: Partial<PlatformOffer>) =>
    api.post<PlatformOffer>("/platform-offers/", data),
  updateOffer: (id: number, data: Partial<PlatformOffer>) =>
    api.patch<PlatformOffer>(`/platform-offers/${id}/`, data),

  // Campaigns
  campaigns: () => api.get<PlatformCampaign[]>("/platform-email-campaigns/"),
  createCampaign: (data: Partial<PlatformCampaign>) =>
    api.post<PlatformCampaign>("/platform-email-campaigns/", data),
  sendCampaign: (id: number) =>
    api.post<PlatformCampaign>(`/platform-email-campaigns/${id}/send_now/`),
};
