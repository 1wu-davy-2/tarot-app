"use client";

const STORAGE_KEY_AUTH = "tarot_auth";
const STORAGE_KEY_USAGE = "tarot_usage";
const STORAGE_KEY_VCODE = "tarot_vcode";
const STORAGE_KEY_GUEST = "tarot_guest_used";

const GUEST_FREE_LIMIT = 1;
const LOGGED_IN_DAILY_LIMIT = 3;

export interface AuthState {
  phone: string;
  loggedIn: boolean;
  isAdmin: boolean;
  loginTime: number;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Auth ──

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function saveAuth(auth: AuthState) {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export function isLoggedIn(): boolean {
  const auth = getAuth();
  return !!auth && auth.loggedIn;
}

export function isAdmin(): boolean {
  const auth = getAuth();
  return !!auth && auth.isAdmin;
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

// ── Verification Code ──

export function generateVCode(): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem(STORAGE_KEY_VCODE, code);
  return code;
}

export function getVCode(): string {
  return localStorage.getItem(STORAGE_KEY_VCODE) || "";
}

export function verifyCode(input: string): boolean {
  const stored = getVCode();
  return stored.length === 6 && input.trim() === stored;
}

// ── Login ──

export function login(phone: string, code: string): { success: boolean; error?: string } {
  if (!validatePhone(phone)) {
    return { success: false, error: "请输入有效的手机号码" };
  }

  if (!verifyCode(code)) {
    return { success: false, error: "验证码错误，请点击验证码输入框获取" };
  }

  saveAuth({ phone: phone.trim(), loggedIn: true, isAdmin: false, loginTime: Date.now() });
  return { success: true };
}

export function logout() {
  clearAuth();
}

// ── Rate Limiting ──

interface UsageData {
  date: string;
  count: number;
}

function getUsage(): UsageData {
  if (typeof window === "undefined") return { date: getToday(), count: 0 };
  const raw = localStorage.getItem(STORAGE_KEY_USAGE);
  if (!raw) return { date: getToday(), count: 0 };
  try {
    const data = JSON.parse(raw) as UsageData;
    // Reset if new day (24h rolling based on date string)
    if (data.date !== getToday()) {
      return { date: getToday(), count: 0 };
    }
    return data;
  } catch {
    return { date: getToday(), count: 0 };
  }
}

function saveUsage(data: UsageData) {
  localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(data));
}

export function getRemainingUses(): number {
  const auth = getAuth();
  if (auth && auth.loggedIn) {
    const usage = getUsage();
    return Math.max(0, LOGGED_IN_DAILY_LIMIT - usage.count);
  }

  // Guest: check if they've used their freebie
  if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY_GUEST) === "1") {
    return 0;
  }
  return GUEST_FREE_LIMIT;
}

export function consumeUse(): boolean {
  const auth = getAuth();
  if (auth && auth.loggedIn) {
    const usage = getUsage();
    if (usage.count >= LOGGED_IN_DAILY_LIMIT) return false;
    usage.count += 1;
    saveUsage(usage);
    return true;
  }

  // Guest
  if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY_GUEST) === "1") {
    return false;
  }
  localStorage.setItem(STORAGE_KEY_GUEST, "1");
  return true;
}

export function getLimitMessage(): string {
  const auth = getAuth();
  if (auth && auth.loggedIn) {
    const remaining = getRemainingUses();
    if (remaining <= 0) {
      return "今日 AI 解读次数已用完（3次/天），请明天再来";
    }
    return `今日剩余 AI 解读次数：${remaining}`;
  }

  if (getRemainingUses() <= 0) {
    return "免费次数已用完，请登录后每天可使用 3 次 AI 解读";
  }
  return "登录后每天可使用 3 次 AI 深度解读";
}
