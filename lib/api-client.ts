// 设置了就用直连（Docker/本地）；不设就走相对路径（Vercel 代理模式）
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const TOKEN_KEY = "tarot_token";
const USER_KEY = "tarot_user";
const ACTIVITY_KEY = "tarot_last_activity";
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredUser {
  id: number;
  username: string;
  email: string;
  phone?: string;
  zodiac?: string;
  is_admin: boolean;
  ai_model?: string;
  membership_tier?: string;
  membership_expiry?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
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
  const token = getToken();
  if (!token) return false;
  // Check JWT expiry
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      logout();
      return false;
    }
  } catch {
    // If we can't decode, assume invalid
    logout();
    return false;
  }
  return true;
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
  if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-change"));
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
    // Auto-logout on 401 (token expired/invalid)
    if (res.status === 401 && auth) {
      logout();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-expired"));
    }
    throw new Error(data.detail || "请求失败");
  }

  return data as T;
}

// ── Auth ──

export async function apiRegister(username: string, email: string, password: string, phone: string, code: string, zodiac?: string) {
  return api("/api/auth/register", {
    method: "POST",
    body: { username, email, password, phone, code, zodiac },
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

export async function apiLogin(account: string, password: string, isApk = false) {
  const data = await api<any>("/api/auth/login", {
    method: "POST",
    body: { account, password, is_apk: isApk },
  });
  setToken(data.access_token);
  setStoredUser({
    id: 0,
    username: data.username,
    email: data.email,
    zodiac: data.zodiac,
    is_admin: data.is_admin,
    membership_tier: data.membership_tier,
    membership_expiry: data.membership_expiry,
    phone: data.phone,
    ai_model: data.ai_model,
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-change"));
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
    zodiac: data.zodiac,
    is_admin: data.is_admin,
    birth_date: data.birth_date,
    birth_time: data.birth_time,
    birth_place: data.birth_place,
    phone: data.phone,
    ai_model: data.ai_model,
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

export async function apiPatchReading(id: number, data: { ai_response: string }) {
  return api(`/api/readings/${id}`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function apiGetReadings(limit: number = 50, offset: number = 0) {
  return api<any[]>(`/api/readings?limit=${limit}&offset=${offset}`, { auth: true });
}

// ── Zodiac & Horoscope ──

export async function apiGetHoroscope(sign: string) {
  return api<{ sign: string; date: string; text: string; cached: boolean }>(`/api/horoscope?sign=${encodeURIComponent(sign)}`);
}

// ── Announcement ──

export async function apiGetAnnouncement() {
  return api<{ text: string; expire_at: string | null }>("/api/announcement");
}

// ── Journal ──

export async function apiSaveJournalEntry(data: {
  date: string;
  card_id: number;
  is_reversed: boolean;
  mood?: number;
  note?: string;
}) {
  return api("/api/journal", { method: "POST", auth: true, body: data });
}

export async function apiGetJournalEntry(date: string) {
  return api<any>(`/api/journal?date=${date}`, { auth: true });
}

export async function apiGetMonthJournal(month: string) {
  return api<{ entries: any[] }>(`/api/journal?month=${month}`, { auth: true });
}

export async function apiDeleteJournalEntry(id: number) {
  return api(`/api/journal/${id}`, { method: "DELETE", auth: true });
}

export async function apiGenerateMonthlyReport(
  month: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<{ elements?: Record<string, number>; moods?: Record<string, number>; upright?: number; reversed?: number; total?: number } | null> {
  const token = getToken();
  const url = `${API_BASE}/api/journal/monthly-report`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ month }),
    });

    if (!response.ok) {
      const data = await response.json();
      onError(data.error || data.detail || "请求失败");
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError("无法读取响应流"); return null; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") { onDone(); return null; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError(parsed.error); return null; }
          if (parsed.content) onChunk(parsed.content);
        } catch {}
      }
    }
    onDone();
    return null;
  } catch (err: any) {
    onError(err.message || "网络错误");
    return null;
  }
}

export async function apiGetJournalRange(start: string, end: string) {
  return api<{ entries: any[] }>(`/api/journal?start=${start}&end=${end}`, { auth: true });
}

export async function apiGenerateWeeklyReport(
  startDate: string,
  endDate: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const token = getToken();
  const url = `${API_BASE}/api/journal/weekly-report`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    });

    if (!response.ok) {
      const data = await response.json();
      onError(data.error || data.detail || "请求失败");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError("无法读取响应流"); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.content) onChunk(parsed.content);
        } catch {}
      }
    }
    onDone();
  } catch (err: any) {
    onError(err.message || "网络错误");
  }
}

// ── Profile Update ──

// ── Spread Templates ──

export async function apiUploadSpreadTemplate(data: {
  name: string;
  description: string;
  card_count: number;
  layout_json: string;
  icon?: string;
}) {
  return api<{ ok: boolean; id: number; name: string }>("/api/spread-templates", {
    method: "POST",
    body: data,
  });
}

export async function apiGetSpreadTemplates(sort: "popular" | "newest" = "popular") {
  return api<Array<{
    id: number;
    name: string;
    description: string;
    card_count: number;
    layout_json: string;
    icon: string;
    use_count: number;
    created_at: string;
  }>>(`/api/spread-templates?sort=${sort}`);
}

export async function apiUseSpreadTemplate(id: number) {
  return api<{ ok: boolean; use_count: number }>(`/api/spread-templates/${id}/use`, {
    method: "POST",
  });
}

export async function apiUpdateProfile(data: {
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  zodiac?: string;
  mbti_type?: string;
  sm_type?: string;
  sm_scores?: string;
}) {
  const result = await api<any>("/api/auth/me", {
    method: "PATCH",
    auth: true,
    body: data,
  });
  const prev = getStoredUser() || {} as any;
  setStoredUser({
    ...prev,
    id: result.id,
    username: result.username,
    email: result.email,
    zodiac: result.zodiac,
    is_admin: result.is_admin,
    membership_tier: result.membership_tier ?? prev.membership_tier,
    membership_expiry: result.membership_expiry ?? prev.membership_expiry,
    birth_date: result.birth_date,
    birth_time: result.birth_time,
    birth_place: result.birth_place,
  });
  return result;
}

/** Sync personality test results to backend for logged-in users. */
export async function apiSyncPersonality(data: {
  mbti_type?: string;
  sm_type?: string;
  sm_scores?: string;
}) {
  if (!isLoggedIn()) return false;
  try {
    await apiUpdateProfile(data);
    return true;
  } catch {
    console.warn("[personality] Sync to server failed, results saved locally only");
    return false;
  }
}

/** Fetch spicy Dirty/Sweet Talk phrases from DB for a given S/M type. */
export async function apiGetSmTalks(smType: string): Promise<{
  sm_type: string;
  dirty_talk: string[];
  sweet_talk: string[];
} | null> {
  try {
    return await api<{
      sm_type: string;
      dirty_talk: string[];
      sweet_talk: string[];
    }>(`/api/personality/sm-talks?sm_type=${encodeURIComponent(smType)}`);
  } catch {
    return null;
  }
}
