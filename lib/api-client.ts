// 空字符串 = 相对路径（Vercel 代理模式）；有值 = 直连后端（Docker 模式）
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8188";

const TOKEN_KEY = "tarot_token";
const USER_KEY = "tarot_user";
const ACTIVITY_KEY = "tarot_last_activity";
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

// ── Token management ──

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  updateActivity();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  return getStoredUser()?.is_admin ?? false;
}

// ── Session timeout (24h inactivity) ──

export function updateActivity() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

export function checkSession(): boolean {
  if (!isLoggedIn()) return false;
  const lastActivity = localStorage.getItem(ACTIVITY_KEY);
  if (!lastActivity) return false;
  const elapsed = Date.now() - Number(lastActivity);
  return elapsed < SESSION_TIMEOUT_MS;
}

export function logout() {
  clearToken();
  localStorage.removeItem(ACTIVITY_KEY);
}

// ── API call helper ──

async function api<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "请求失败");
  }

  return data as T;
}

// ── Auth ──

export async function apiRegister(username: string, email: string, password: string, phone: string, code: string) {
  return api("/api/auth/register", {
    method: "POST",
    body: { username, email, password, phone, code },
  });
}

export async function apiSendCode(email: string, type: string = "register") {
  return api("/api/auth/send-code", {
    method: "POST",
    body: { email, type },
  });
}

export async function apiVerifyEmail(email: string, code: string) {
  return api("/api/auth/verify-email", {
    method: "POST",
    body: { email, code },
  });
}

export async function apiLogin(account: string, password: string) {
  const data = await api<any>("/api/auth/login", {
    method: "POST",
    body: { account, password },
  });
  setToken(data.access_token);
  setStoredUser({
    id: 0,
    username: data.username,
    email: data.email,
    is_admin: data.is_admin,
  });
  return data;
}

export async function apiForgotPassword(email: string) {
  return api("/api/auth/forgot-password", {
    method: "POST",
    body: { email, type: "reset" },
  });
}

export async function apiResetPassword(email: string, code: string, newPassword: string) {
  return api("/api/auth/reset-password", {
    method: "POST",
    body: { email, code, new_password: newPassword },
  });
}

export async function apiGetMe() {
  const data = await api<any>("/api/auth/me", { auth: true });
  setStoredUser({
    id: data.id,
    username: data.username,
    email: data.email,
    is_admin: data.is_admin,
  });
  return data;
}

// ── Quota ──

export async function apiGetQuota() {
  return api<{
    date: string;
    base_quota: number;
    bonus_quota: number;
    used_count: number;
    remaining: number;
  }>("/api/quota", { auth: true });
}

export async function apiConsumeQuota() {
  return api<{ success: boolean; remaining: number }>("/api/quota/consume", {
    method: "POST",
    auth: true,
  });
}

// ── Check-in ──

export async function apiCheckIn() {
  return api<{
    date: string;
    bonus_awarded: number;
    already_checked_in: boolean;
    message: string;
  }>("/api/checkin", { method: "POST", auth: true });
}

// ── Readings ──

export async function apiSaveReading(data: {
  question: string;
  ai_response: string;
  spread_type: string;
  cards: any[];
}) {
  return api("/api/readings", {
    method: "POST",
    auth: true,
    body: data,
  });
}

export async function apiGetReadings(limit: number = 50, offset: number = 0) {
  return api<any[]>(`/api/readings?limit=${limit}&offset=${offset}`, { auth: true });
}
