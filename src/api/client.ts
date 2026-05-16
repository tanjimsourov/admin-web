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
    throw new Error(error.detail || `Request failed: ${response.status}`);
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
  date_joined: string;
  last_login: string | null;
  workspace_count: number;
  site_count: number;
  order_count: number;
}

export interface PlatformWorkspace {
  id: number;
  name: string;
  slug: string;
  owner_username: string;
  owner_email: string;
  member_count: number;
  site_count: number;
  created_at: string;
  subscription_status: string | null;
  subscription_plan: string | null;
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
  status: string;
  starts_at: string;
  ends_at: string | null;
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
  recipient_count: number;
  sent_count: number;
  sent_at: string | null;
  created_at: string;
}

export const platformAdminApi = {
  overview: () => api.get<PlatformOverview>("/platform-admin/overview/"),
  users: (query?: string) =>
    api.get<PlatformUser[]>(`/platform-admin/users/${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  workspaces: (query?: string) =>
    api.get<PlatformWorkspace[]>(`/platform-admin/workspaces/${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  activateUser: (userId: number) =>
    api.post<{ id: number; is_active: boolean }>(`/platform-admin/users/${userId}/activate/`),
  deactivateUser: (userId: number) =>
    api.post<{ id: number; is_active: boolean }>(`/platform-admin/users/${userId}/deactivate/`),

  // Subscriptions
  subscriptions: () => api.get<PlatformSubscription[]>("/platform-subscriptions/"),
  pauseSubscription: (id: number) =>
    api.post<PlatformSubscription>(`/platform-subscriptions/${id}/pause/`),
  resumeSubscription: (id: number) =>
    api.post<PlatformSubscription>(`/platform-subscriptions/${id}/resume/`),

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
