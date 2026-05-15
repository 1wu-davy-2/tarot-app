// Achievement / gamification system.
// Pure client-side — computed from localStorage + existing API data.
// Unlocked achievements stored in localStorage under "tarot_achievements".

import { tarotCards } from "./tarot-data";

export type AchievementTier = "bronze" | "silver" | "gold" | "mystic";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  secret?: boolean;
  // Returns current progress: [current, target]. If current >= target, achievement is unlocked.
  progress: () => [number, number];
}

const STORAGE_KEY = "tarot_achievements";
const COLLECTED_KEY = "tarot_collected_cards"; // Set of card IDs pulled

// ── Helpers ──

function getUnlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function unlock(id: string) {
  const unlocked = getUnlocked();
  unlocked.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
}

export function isUnlocked(id: string): boolean {
  return getUnlocked().has(id);
}

// Card collection tracking
function getCollectedCards(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(COLLECTED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function trackCollectedCard(cardId: number) {
  const collected = getCollectedCards();
  collected.add(cardId);
  localStorage.setItem(COLLECTED_KEY, JSON.stringify([...collected]));
}

export function getCollectedCount(): number {
  return getCollectedCards().size;
}

export function getCollectedMajorCount(): number {
  const collected = getCollectedCards();
  let count = 0;
  for (const id of collected) {
    const card = tarotCards.find((c) => c.id === id);
    if (card?.arcana === "major") count++;
  }
  return count;
}

function getCheckinStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const history = JSON.parse(localStorage.getItem("tarot_checkin_history") || "[]") as string[];
    if (!history.length) return 0;
    history.sort().reverse();
    let streak = 1;
    const today = new Date();
    for (let i = 0; i < history.length - 1; i++) {
      const d1 = new Date(history[i]);
      const d2 = new Date(history[i + 1]);
      const diff = (d1.getTime() - d2.getTime()) / 86400000;
      if (Math.abs(diff - 1) < 0.1) streak++;
      else break;
    }
    return streak;
  } catch { return 0; }
}

function getTotalCheckins(): number {
  if (typeof window === "undefined") return 0;
  try {
    return JSON.parse(localStorage.getItem("tarot_checkin_history") || "[]").length;
  } catch { return 0; }
}

function getTotalReadings(): number {
  if (typeof window === "undefined") return 0;
  const count = parseInt(localStorage.getItem("tarot_reading_count") || "0", 10);
  // Also check server readings in localStorage
  try {
    const history = JSON.parse(localStorage.getItem("tarot_reading_history") || "[]");
    return Math.max(count, history.length);
  } catch { return count; }
}

function getTotalDiary(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("tarot_diary_count") || "0", 10);
}

function getUsedSpreads(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem("tarot_used_spreads") || "[]"));
  } catch { return new Set(); }
}

// ── Achievement definitions ──

export const ACHIEVEMENTS: Achievement[] = [
  // Check-in streaks
  {
    id: "checkin_7",
    title: "七日之约",
    description: "连续签到 7 天",
    icon: "🌙",
    tier: "bronze",
    progress: () => [getCheckinStreak(), 7],
  },
  {
    id: "checkin_30",
    title: "月之守护",
    description: "连续签到 30 天",
    icon: "🌕",
    tier: "silver",
    progress: () => [getCheckinStreak(), 30],
  },
  {
    id: "checkin_100",
    title: "四季轮回",
    description: "累计签到 100 天",
    icon: "🌟",
    tier: "gold",
    progress: () => [getTotalCheckins(), 100],
  },

  // Card collection
  {
    id: "collect_22",
    title: "大阿卡纳之主",
    description: "抽到全部 22 张大阿卡纳牌",
    icon: "✧",
    tier: "silver",
    progress: () => [getCollectedMajorCount(), 22],
  },
  {
    id: "collect_78",
    title: "牌库大师",
    description: "抽到全部 78 张塔罗牌",
    icon: "🃏",
    tier: "gold",
    progress: () => [getCollectedCount(), 78],
  },

  // Reading count
  {
    id: "reading_10",
    title: "初窥门径",
    description: "累计完成 10 次 AI 解读",
    icon: "🔮",
    tier: "bronze",
    progress: () => [getTotalReadings(), 10],
  },
  {
    id: "reading_100",
    title: "百问不倦",
    description: "累计完成 100 次 AI 解读",
    icon: "💎",
    tier: "gold",
    progress: () => [getTotalReadings(), 100],
  },

  // Spread mastery
  {
    id: "spread_all",
    title: "牌阵大师",
    description: "使用过全部 6 种牌阵类型",
    icon: "🎴",
    tier: "mystic",
    progress: () => [getUsedSpreads().size, 6],
  },

  // Diary
  {
    id: "diary_30",
    title: "一月日记",
    description: "写满 30 篇塔罗日记",
    icon: "📖",
    tier: "silver",
    progress: () => [getTotalDiary(), 30],
  },

  // ── Hidden achievements ──
  {
    id: "midnight",
    title: "午夜占卜师",
    description: "在凌晨 0:00 - 3:00 进行占卜",
    icon: "🦉",
    tier: "mystic",
    secret: true,
    progress: () => {
      const hour = new Date().getHours();
      // This only triggers during midnight hours. Tracked via localStorage flag.
      const flag = typeof window !== "undefined" && localStorage.getItem("tarot_midnight_reading") === "1";
      return [flag ? 1 : 0, 1];
    },
  },
  {
    id: "reverse_all",
    title: "逆位之王",
    description: "一次牌阵中所有牌都是逆位",
    icon: "🌀",
    tier: "mystic",
    secret: true,
    progress: () => {
      const flag = typeof window !== "undefined" && localStorage.getItem("tarot_all_reversed") === "1";
      return [flag ? 1 : 0, 1];
    },
  },
];

// ── Check & unlock ──

export interface AchievementEvent {
  achievement: Achievement;
  isNew: boolean; // true if just unlocked now
}

export function checkAchievements(): AchievementEvent[] {
  const unlocked = getUnlocked();
  const events: AchievementEvent[] = [];

  for (const a of ACHIEVEMENTS) {
    const [current, target] = a.progress();
    if (current >= target && !unlocked.has(a.id)) {
      unlock(a.id);
      events.push({ achievement: a, isNew: true });
    }
  }

  return events;
}

export function getAllAchievementProgress(): Array<Achievement & { unlocked: boolean; current: number; target: number }> {
  const unlocked = getUnlocked();
  return ACHIEVEMENTS.map((a) => {
    const [current, target] = a.progress();
    return { ...a, unlocked: unlocked.has(a.id), current, target };
  });
}

// ── Tracking helpers called from key actions ──

export function trackCheckin() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const history = JSON.parse(localStorage.getItem("tarot_checkin_history") || "[]") as string[];
    if (!history.includes(today)) {
      history.push(today);
      localStorage.setItem("tarot_checkin_history", JSON.stringify(history));
    }
  } catch {}
}

export function trackReading() {
  if (typeof window === "undefined") return;
  const count = parseInt(localStorage.getItem("tarot_reading_count") || "0", 10);
  localStorage.setItem("tarot_reading_count", String(count + 1));

  // Track midnight reading
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 3) {
    localStorage.setItem("tarot_midnight_reading", "1");
  }
}

export function trackSpreadType(spreadType: string) {
  if (typeof window === "undefined") return;
  try {
    const spreads = JSON.parse(localStorage.getItem("tarot_used_spreads") || "[]") as string[];
    if (!spreads.includes(spreadType)) {
      spreads.push(spreadType);
      localStorage.setItem("tarot_used_spreads", JSON.stringify(spreads));
    }
  } catch {}
}

export function trackAllReversed(allReversed: boolean[]) {
  if (typeof window === "undefined") return;
  if (allReversed.length > 0 && allReversed.every((r) => r)) {
    localStorage.setItem("tarot_all_reversed", "1");
  }
}

export function trackDiaryEntry() {
  if (typeof window === "undefined") return;
  const count = parseInt(localStorage.getItem("tarot_diary_count") || "0", 10);
  localStorage.setItem("tarot_diary_count", String(count + 1));
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "border-amber-600/40 bg-amber-600/5 text-amber-400/80",
  silver: "border-slate-400/30 bg-slate-400/5 text-slate-300/80",
  gold: "border-mystic-gold/40 bg-mystic-gold/5 text-mystic-gold",
  mystic: "border-mystic-rose/40 bg-mystic-rose/5 text-text-primary",
};

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: "铜",
  silver: "银",
  gold: "金",
  mystic: "秘",
};
