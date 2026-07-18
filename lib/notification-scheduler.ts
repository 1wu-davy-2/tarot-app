// Notification scheduler — APK uses Capacitor Local Notifications, Web uses page-level toasts.
// Settings stored in localStorage under "tarot_notify_settings".

import { getMoonPhase } from "./astro-events";

export interface NotifySettings {
  dailyCard: { enabled: boolean; time: string };   // e.g. "09:00"
  moonPhase: { enabled: boolean };
  checkIn: { enabled: boolean; time: string };
  membershipExpiry: { enabled: boolean };
}

const STORAGE_KEY = "tarot_notify_settings";
const DAILY_CARD_SENTENCE_KEY = "tarot_daily_card_sentence";

const DEFAULTS: NotifySettings = {
  dailyCard: { enabled: true, time: "09:00" },
  moonPhase: { enabled: true },
  checkIn: { enabled: true, time: "10:00" },
  membershipExpiry: { enabled: true },
};

// ── Daily card sentence caching ──

interface DailyCardSentence {
  date: string;
  card_name_cn: string;
  is_reversed: boolean;
  sentence: string;
}

export async function fetchDailyCardSentence(): Promise<DailyCardSentence | null> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Check localStorage cache first
    const cached = getCachedDailySentence();
    if (cached && cached.date === today) return cached;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    const url = API_BASE
      ? `${API_BASE}/api/fortune/daily-card-sentence`
      : "/api/fortune/daily-card-sentence";
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.sentence) {
      cacheDailySentence(data);
      return data;
    }
  } catch {}
  return null;
}

function cacheDailySentence(data: DailyCardSentence) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAILY_CARD_SENTENCE_KEY, JSON.stringify({ ...data, _cached_at: Date.now() }));
  } catch {}
}

function getCachedDailySentence(): DailyCardSentence | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_CARD_SENTENCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {}
  return null;
}

export function getDailyCardNotificationBody(data: DailyCardSentence | null): string {
  if (data) {
    const orientation = data.is_reversed ? "逆" : "正";
    return `${data.card_name_cn} · ${orientation}位 — ${data.sentence}`;
  }
  return "今日运势牌已揭晓，点击查看今日指引";
}

export function getNotifySettings(): NotifySettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function saveNotifySettings(s: NotifySettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Web reminder check (called every ~60s by setInterval) ──

export interface ReminderPayload {
  id: string;
  title: string;
  body: string;
  action?: { label: string; path: string };  // e.g. navigate to /daily
}

let lastFired: Record<string, string> = {}; // id → date string, prevents re-fire same day

export function checkWebReminders(
  settings: NotifySettings,
  onReminder: (payload: ReminderPayload) => void
): void {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Daily card reminder
  if (settings.dailyCard.enabled && hhmm === settings.dailyCard.time) {
    const key = `daily-${today}`;
    if (lastFired["daily"] !== key) {
      lastFired["daily"] = key;
      const cached = getCachedDailySentence();
      const body = getDailyCardNotificationBody(
        cached && cached.date === today ? cached : null
      );
      onReminder({
        id: "daily-card",
        title: "命运之镜 · 每日塔罗",
        body,
        action: { label: "查看", path: "/daily" },
      });
    }
  }

  // Moon phase reminder (fire at 08:00 on new/full moon days)
  if (settings.moonPhase.enabled && hhmm === "08:00") {
    const key = `moon-${today}`;
    if (lastFired["moon"] !== key) {
      const phase = getMoonPhase(now);
      if (phase < 0.03 || phase > 0.97) {
        lastFired["moon"] = key;
        onReminder({
          id: "moon-phase",
          title: "命运之镜 · 新月降临",
          body: "今晚是新月，适合冥想、许愿与占卜",
          action: { label: "查看", path: "/journal" },
        });
      } else if (phase > 0.47 && phase < 0.53) {
        lastFired["moon"] = key;
        onReminder({
          id: "moon-phase",
          title: "命运之镜 · 满月之约",
          body: "今晚是满月，能量最强的占卜之夜",
          action: { label: "查看", path: "/journal" },
        });
      }
    }
  }

  // Check-in reminder
  if (settings.checkIn.enabled && hhmm === settings.checkIn.time) {
    const key = `checkin-${today}`;
    if (lastFired["checkin"] !== key) {
      lastFired["checkin"] = key;
      const checkedIn = typeof window !== "undefined" && localStorage.getItem("tarot_checked_in_today") === today;
      if (!checkedIn) {
        onReminder({
          id: "check-in",
          title: "命运之镜 · 签到提醒",
          body: "今日尚未签到，点击签到获取 AI 解读次数",
          action: { label: "去签到", path: "/profile" },
        });
      }
    }
  }

  // Membership expiry reminder (3 days before, at 08:00)
  if (settings.membershipExpiry.enabled && hhmm === "08:00") {
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("tarot_user") || "{}");
        if (user?.membership_expiry) {
          const expiry = new Date(user.membership_expiry);
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
          if (daysLeft >= 1 && daysLeft <= 3) {
            const key = `membership-${today}`;
            if (lastFired["membership"] !== key) {
              lastFired["membership"] = key;
              onReminder({
                id: "membership-expiry",
                title: "命运之镜 · 会员即将到期",
                body: `你的会员将在 ${daysLeft} 天后到期`,
                action: { label: "查看", path: "/profile" },
              });
            }
          }
        }
      } catch {}
    }
  }
}

// ── APK: Capacitor Local Notifications ──

export async function scheduleAPKNotifications(settings: NotifySettings): Promise<void> {
  // Dynamic import to avoid build errors when @capacitor/local-notifications is not installed
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // Request permission
    await LocalNotifications.requestPermissions();

    // Pre-fetch today's daily card sentence
    const dailySentence = await fetchDailyCardSentence().catch(() => null);

    // Clear existing and schedule new ones for next 7 days
    const notifications: Array<{
      title: string;
      body: string;
      id: number;
      schedule: { at: Date };
      extra?: { path: string };
    }> = [];

    let idCounter = 100;
    const now = new Date();

    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);

      // Daily card
      if (settings.dailyCard.enabled) {
        const [h, m] = settings.dailyCard.time.split(":").map(Number);
        const at = new Date(date);
        at.setHours(h, m, 0, 0);
        if (at > now) {
          const body = d === 0
            ? getDailyCardNotificationBody(dailySentence)
            : "今日运势牌已揭晓，点击查看今日指引";
          notifications.push({
            title: "命运之镜 · 每日塔罗",
            body,
            id: idCounter++,
            schedule: { at },
            extra: { path: "/daily" },
          });
        }
      }

      // Moon phase (only on new/full moon days)
      if (settings.moonPhase.enabled) {
        const phase = getMoonPhase(date);
        if (phase < 0.03 || phase > 0.97 || (phase > 0.47 && phase < 0.53)) {
          const isNew = phase < 0.03 || phase > 0.97;
          const at = new Date(date);
          at.setHours(8, 0, 0, 0);
          if (at > now) {
            notifications.push({
              title: isNew ? "命运之镜 · 新月降临" : "命运之镜 · 满月之约",
              body: isNew ? "新月之夜，适合冥想与许愿" : "满月之夜，能量最强的占卜夜",
              id: idCounter++,
              schedule: { at },
              extra: { path: "/journal" },
            });
          }
        }
      }

      // Check-in
      if (settings.checkIn.enabled) {
        const [h, m] = settings.checkIn.time.split(":").map(Number);
        const at = new Date(date);
        at.setHours(h, m, 0, 0);
        if (at > now) {
          notifications.push({
            title: "命运之镜 · 签到提醒",
            body: "今日尚未签到，点击签到获取 AI 解读次数",
            id: idCounter++,
            schedule: { at },
            extra: { path: "/profile" },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    // Capacitor plugin not available (web build), ignore silently
  }
}
