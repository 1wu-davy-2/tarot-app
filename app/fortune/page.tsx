"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check, Zap } from "lucide-react";
import {
  generateLuckyItems, generateFortuneScores, generatePeriodScores, generatePeriodLuckyItems,
  generateSuggestAvoid, getTodayEnergyTasks, toggleEnergyTask,
  SCORE_LABELS, PERIOD_LABELS,
  type LuckyItems, type FortuneScores, type Period, type EnergyTaskState,
} from "@/lib/fortune-data";
import { getStoredUser } from "@/lib/api-client";
import { getMoonPhaseName, getMoonPhaseEmoji } from "@/lib/astro-events";
import { FortuneModal } from "@/components/FortuneModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const ZODIAC_SIGNS = [
  { name: "白羊座", emoji: "♈", element: "火", dateRange: "3.21-4.19", compat: "狮子座" },
  { name: "金牛座", emoji: "♉", element: "土", dateRange: "4.20-5.20", compat: "处女座" },
  { name: "双子座", emoji: "♊", element: "风", dateRange: "5.21-6.21", compat: "天秤座" },
  { name: "巨蟹座", emoji: "♋", element: "水", dateRange: "6.22-7.22", compat: "天蝎座" },
  { name: "狮子座", emoji: "♌", element: "火", dateRange: "7.23-8.22", compat: "射手座" },
  { name: "处女座", emoji: "♍", element: "土", dateRange: "8.23-9.22", compat: "摩羯座" },
  { name: "天秤座", emoji: "♎", element: "风", dateRange: "9.23-10.23", compat: "水瓶座" },
  { name: "天蝎座", emoji: "♏", element: "水", dateRange: "10.24-11.22", compat: "双鱼座" },
  { name: "射手座", emoji: "♐", element: "火", dateRange: "11.23-12.21", compat: "白羊座" },
  { name: "摩羯座", emoji: "♑", element: "土", dateRange: "12.22-1.19", compat: "金牛座" },
  { name: "水瓶座", emoji: "♒", element: "风", dateRange: "1.20-2.18", compat: "双子座" },
  { name: "双鱼座", emoji: "♓", element: "水", dateRange: "2.19-3.20", compat: "巨蟹座" },
];

const COMPAT_SCORES: Record<string, number> = {
  "白羊座-狮子座": 92, "金牛座-处女座": 88, "双子座-天秤座": 90,
  "巨蟹座-天蝎座": 95, "狮子座-射手座": 91, "处女座-摩羯座": 87,
  "天秤座-水瓶座": 89, "天蝎座-双鱼座": 94, "射手座-白羊座": 92,
  "摩羯座-金牛座": 88, "水瓶座-双子座": 90, "双鱼座-巨蟹座": 95,
};

// Approximate solar terms (month-day key → term name)
const SOLAR_TERMS: Record<string, string> = {
  "1-5": "小寒", "1-20": "大寒", "2-4": "立春", "2-19": "雨水",
  "3-6": "惊蛰", "3-21": "春分", "4-5": "清明", "4-20": "谷雨",
  "5-6": "立夏", "5-21": "小满", "6-6": "芒种", "6-21": "夏至",
  "7-7": "小暑", "7-23": "大暑", "8-7": "立秋", "8-23": "处暑",
  "9-8": "白露", "9-23": "秋分", "10-8": "寒露", "10-24": "霜降",
  "11-7": "立冬", "11-22": "小雪", "12-7": "大雪", "12-22": "冬至",
};

function getSolarTerm(dateStr: string): string | null {
  const d = new Date(dateStr + "T12:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const keys = Object.keys(SOLAR_TERMS).sort((a, b) => {
    const [am, ad] = a.split("-").map(Number);
    const [bm, bd] = b.split("-").map(Number);
    return (am * 100 + ad) - (bm * 100 + bd);
  });
  let result: string | null = null;
  for (const key of keys) {
    const [km, kd] = key.split("-").map(Number);
    if (m > km || (m === km && day >= kd)) {
      result = SOLAR_TERMS[key];
    } else break;
  }
  return result;
}

function deriveZodiac(birthDate: string): string | null {
  const parts = birthDate.split("-");
  if (parts.length < 2) return null;
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(month) || isNaN(day)) return null;
  const ranges: [number, number, string][] = [
    [3, 21, "白羊座"], [4, 20, "金牛座"], [5, 21, "双子座"], [6, 22, "巨蟹座"],
    [7, 23, "狮子座"], [8, 23, "处女座"], [9, 23, "天秤座"], [10, 24, "天蝎座"],
    [11, 23, "射手座"], [12, 22, "摩羯座"], [1, 20, "水瓶座"], [2, 19, "双鱼座"],
  ];
  for (let i = 0; i < ranges.length; i++) {
    const [m, d, name] = ranges[i];
    const next = ranges[(i + 1) % ranges.length];
    if (month === m && day >= d) return name;
    if (month === next[0] && day < next[1]) return name;
  }
  return "摩羯座";
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export default function FortunePage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [zodiac, setZodiac] = useState("");
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [period, setPeriod] = useState<Period>("daily");
  const [scores, setScores] = useState<FortuneScores | null>(null);
  const [lucky, setLucky] = useState<LuckyItems | null>(null);
  const [suggestAvoid, setSuggestAvoid] = useState<{ suggest: string[]; avoid: string[] } | null>(null);
  const [energyState, setEnergyState] = useState<EnergyTaskState | null>(null);
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  const handleOpenFortune = async () => {
    const token = localStorage.getItem("tarot_token");
    if (!token || token === "undefined") {
      // Guest — open directly
      setFortuneModalOpen(true);
      return;
    }
    try {
      const url = API_BASE ? `${API_BASE}/api/fortune/quota-remaining` : "/api/fortune/quota-remaining";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.remaining <= 0) {
          setQuotaExhausted(true);
          return;
        }
      }
    } catch {}
    setQuotaExhausted(false);
    setFortuneModalOpen(true);
  };

  const zodiacFetched = useRef(false);

  // Compute Mon-Sun of current week
  const weekDates = (() => {
    const now = new Date(todayStr + "T12:00:00");
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  })();

  // Init from stored user
  useEffect(() => {
    const u = getStoredUser();
    if (u?.zodiac && ZODIAC_SIGNS.some(z => z.name === u.zodiac)) {
      setZodiac(u.zodiac);
      return;
    }
    const token = localStorage.getItem("tarot_token");
    if (!token || zodiacFetched.current || token === "undefined") return;
    zodiacFetched.current = true;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) return null; return r.json(); })
      .then(data => {
        if (!data) return;
        if (data.zodiac && ZODIAC_SIGNS.some(z => z.name === data.zodiac)) {
          setZodiac(data.zodiac);
        } else if (data.birth_date) {
          const derived = deriveZodiac(data.birth_date);
          if (derived) setZodiac(derived);
        }
      })
      .catch(() => {});
  }, []);

  // When zodiac / period / date changes, regenerate local data
  useEffect(() => {
    if (!zodiac) { setScores(null); setLucky(null); setSuggestAvoid(null); setEnergyState(null); return; }
    if (period === "daily") {
      setScores(generateFortuneScores(zodiac, selectedDate));
      setLucky(generateLuckyItems(zodiac, selectedDate));
    } else {
      setScores(generatePeriodScores(zodiac, period, selectedDate));
      setLucky(generatePeriodLuckyItems(zodiac, period, selectedDate));
    }
    setSuggestAvoid(generateSuggestAvoid(zodiac, selectedDate));
    setEnergyState(getTodayEnergyTasks(zodiac, selectedDate));
    setQuotaExhausted(false);
  }, [zodiac, selectedDate, period]);

  const handleToggleTask = (taskId: number) => {
    const updated = toggleEnergyTask(taskId);
    if (updated) setEnergyState(updated);
  };

  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const moonPhase = getMoonPhaseName(new Date(selectedDate + "T12:00:00"));
  const moonEmoji = getMoonPhaseEmoji(new Date(selectedDate + "T12:00:00"));
  const solarTerm = getSolarTerm(selectedDate);

  const selectedZodiac = ZODIAC_SIGNS.find(z => z.name === zodiac);
  const compatZodiac = selectedZodiac ? ZODIAC_SIGNS.find(z => z.name === selectedZodiac.compat) : null;
  const compatKey = selectedZodiac && compatZodiac ? `${selectedZodiac.name}-${compatZodiac.name}` : "";
  const compatBase = COMPAT_SCORES[compatKey] || 85;
  const compatScore = compatKey ? compatBase + (hashCode(`${selectedDate}-${compatKey}`) % 6) - 3 : 0;

  // Mood label for the score
  const scoreLabel = scores
    ? scores.overall >= 85 ? "运势极佳" : scores.overall >= 70 ? "运势良好" : scores.overall >= 55 ? "运势平稳" : "稍低"
    : "";

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-cinzel text-mystic-gold text-glow">每日运势</h1>
          <div className="w-[60px]" />
        </div>
        <p className="text-xs text-text-secondary text-center -mt-1 mb-4">{today}</p>

        {/* Period Tabs */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-mystic-dark/60 border border-mystic-purple/20 rounded-full p-1">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setPeriod(key); setSelectedDate(todayStr); }}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  period === key
                    ? "bg-mystic-gold/25 text-mystic-gold border border-mystic-gold/30"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Zodiac selector */}
        <div className="mb-4 relative">
          <button
            onClick={() => setZodiacOpen(!zodiacOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-mystic-dark/60 border border-mystic-purple/20 hover:border-mystic-gold/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{selectedZodiac?.emoji || "🔮"}</span>
              <span className="text-sm text-text-primary">{zodiac || "选择你的星座"}</span>
              {selectedZodiac && (
                <span className="text-[10px] text-text-tertiary">{selectedZodiac.element}象 · {selectedZodiac.dateRange}</span>
              )}
            </span>
            <span className="text-text-tertiary text-xs">{zodiacOpen ? "收起" : "选择"}</span>
          </button>

          {zodiacOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 left-0 right-0 mt-2 p-3 rounded-xl bg-[#0f0a1a] border border-mystic-purple/30 shadow-2xl grid grid-cols-3 sm:grid-cols-4 gap-2"
            >
              {ZODIAC_SIGNS.map((z) => (
                <button
                  key={z.name}
                  onClick={() => { setZodiac(z.name); setZodiacOpen(false); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                    zodiac === z.name ? "bg-mystic-gold/15 border border-mystic-gold/30" : "hover:bg-mystic-purple/10 border border-transparent"
                  }`}
                >
                  <span className="text-lg">{z.emoji}</span>
                  <span className="text-text-secondary">{z.name}</span>
                  <span className="text-[10px] text-text-tertiary">{z.dateRange}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Week date strip — only in daily mode */}
        {zodiac && period === "daily" && (
          <div className="mb-5">
            <div className="flex justify-between items-center gap-1">
              {weekDates.map((d) => {
                const dayNum = new Date(d + "T12:00:00").getDate();
                const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
                const dayOfWeek = new Date(d + "T12:00:00").getDay();
                const isToday = d === todayStr;
                const isSelected = d === selectedDate;
                const miniScores = zodiac ? generateFortuneScores(zodiac, d) : null;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-xs transition-all min-w-[36px] ${
                      isSelected
                        ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                        : isToday
                        ? "bg-mystic-purple/15 border border-mystic-purple/30 text-text-primary"
                        : "border border-transparent text-text-secondary hover:bg-mystic-purple/10"
                    }`}
                  >
                    <span className="text-[10px] opacity-60">周{dayNames[dayOfWeek]}</span>
                    <span className={`text-sm font-bold ${isToday ? "text-mystic-gold" : ""}`}>{dayNum}</span>
                    {miniScores && (
                      <span className={`text-[10px] font-cinzel ${isSelected ? "text-mystic-gold" : "text-mystic-gold/60"}`}>
                        {miniScores.overall}
                      </span>
                    )}
                    {isToday && <span className="w-1 h-1 rounded-full bg-mystic-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCORE CARD (redesigned: big number + vertical bars) ── */}
        {scores && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-4 relative overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-mystic-gold/5 blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4 mb-4">
              {/* Big score number */}
              <div className="flex-shrink-0 text-center">
                <p className="text-[10px] text-text-tertiary tracking-widest mb-1">TODAY</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl sm:text-6xl font-bold text-mystic-gold font-cinzel leading-none">{scores.overall}</span>
                  <span className="text-sm text-text-secondary">分</span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">{scoreLabel}</p>
              </div>

              {/* 5 vertical bars */}
              <div className="flex-1 flex items-end justify-end gap-3 min-w-0">
                {(Object.entries(SCORE_LABELS) as [string, typeof SCORE_LABELS[string]][]).filter(([k]) => k !== "overall").map(([key, meta]) => {
                  const s = scores[key as keyof FortuneScores];
                  return (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold" style={{ color: s >= 80 ? meta.color : undefined, opacity: s >= 80 ? 1 : 0.55 }}>{s}</span>
                      <div className="w-1.5 rounded-full bg-white/8 overflow-hidden" style={{ height: 48 }}>
                        <div
                          className="w-full rounded-full mt-auto transition-all duration-700"
                          style={{
                            height: `${s}%`,
                            background: `linear-gradient(to top, ${meta.color}, ${meta.color}88)`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-text-tertiary text-center leading-tight">{meta.label.slice(0, 2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description + Suggest/Avoid badges */}
            <div className="pt-3 border-t border-white/8">
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {scores.overall >= 85 ? "诸事顺遂，是行动的好日子，把握当下的每一刻灵感。" :
                 scores.overall >= 70 ? "保持积极心态，好运自来。今天适合稳步推进重要事项。" :
                 scores.overall >= 55 ? "适合内省沉淀，静待花开。不必急于求成，慢下来感受生活。" :
                 "今天需要多些耐心，小确幸藏在细节里。"}
              </p>

              {suggestAvoid && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[10px] text-text-tertiary">建议</span>
                  {suggestAvoid.suggest.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[11px] bg-green-500/10 border border-green-400/25 text-green-400/85">
                      ✦ {tag}
                    </span>
                  ))}
                  <span className="text-[10px] text-text-tertiary ml-2">避免</span>
                  {suggestAvoid.avoid.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[11px] bg-red-500/10 border border-red-400/25 text-red-400/80">
                      ✗ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Moon Phase + Solar Term ── */}
        {zodiac && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div className="glass-card p-4 flex items-center gap-3">
              <span className="text-2xl">{moonEmoji}</span>
              <div>
                <p className="text-[10px] text-text-tertiary tracking-wider mb-0.5">月相</p>
                <p className="text-sm text-text-primary font-medium">{moonPhase}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {moonPhase === "新月" ? "适合开启新计划" :
                   moonPhase === "满月" ? "适合总结与释放" :
                   moonPhase === "残月" || moonPhase === "亏月" ? "能量回收期" : "能量积蓄期"}
                </p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-[10px] text-text-tertiary tracking-wider mb-0.5">节气</p>
                <p className="text-sm text-text-primary font-medium">{solarTerm || "—"}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {solarTerm ? "万物应时，感应天地" : "非节气日"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Lucky Items ── */}
        {lucky && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 mb-4"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-3 flex items-center justify-center gap-2">
              <span className="w-6 h-px bg-mystic-gold/30" /> 幸运元素 <span className="w-6 h-px bg-mystic-gold/30" />
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <LuckyCard label="幸运色" value={lucky.color.name} color={lucky.color.hex} />
              <LuckyCard label="幸运数字" value={String(lucky.number)} />
              <LuckyCard label="幸运方位" value={lucky.direction} />
              <LuckyCard label="幸运花" value={lucky.flower} />
              <LuckyCard label="幸运食物" value={lucky.food} />
              <LuckyCard label="幸运配饰" value={lucky.accessory} />
              <LuckyCard label="黄金时段" value={lucky.timeSlot} />
              <LuckyCard label="随身物" value={lucky.item} />
            </div>
          </motion.div>
        )}

        {/* ── Energy Tasks (interactive checkboxes) ── */}
        {energyState && energyState.tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-card p-5 mb-4"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-4 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> 今日能量挑战
            </h2>
            <div className="space-y-0">
              {energyState.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className="w-full flex items-start gap-3 py-3 border-b border-white/5 last:border-b-0 text-left hover:bg-mystic-purple/5 transition-colors rounded-lg px-2 -mx-2"
                >
                  <span className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    task.done
                      ? "bg-mystic-gold border-mystic-gold"
                      : "border-mystic-gold/30"
                  }`}>
                    {task.done && <Check className="w-3 h-3 text-mystic-dark" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] ${task.done ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                      {task.title}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{task.desc}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold/70 flex-shrink-0">
                    {task.tag}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── AI Fortune Button (opens modal) ── */}
        {zodiac && (
          <div className="text-center mb-4">
            {quotaExhausted ? (
              <p className="text-xs text-text-tertiary">今日 AI 解读次数已用完，明天再来吧 ✨</p>
            ) : (
              <button
                onClick={handleOpenFortune}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                AI {PERIOD_LABELS[period] || "今日"}运势解读
              </button>
            )}
          </div>
        )}

        {/* ── Compatibility Card ── */}
        {selectedZodiac && compatZodiac && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass-card p-4 mb-4 flex items-center gap-4"
          >
            <div className="flex items-center">
              <span className="w-10 h-10 rounded-full bg-mystic-dark/80 border border-mystic-gold/30 flex items-center justify-center text-lg">
                {selectedZodiac.emoji}
              </span>
              <span className="w-10 h-10 rounded-full bg-[#1c0c34] border border-mystic-gold/30 flex items-center justify-center text-lg -ml-2">
                {compatZodiac.emoji}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-tertiary tracking-wider mb-0.5">COMPATIBILITY</p>
              <p className="text-sm text-text-primary font-medium">
                {selectedZodiac.name} & {compatZodiac.name}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mystic-rose to-mystic-gold transition-all duration-700"
                    style={{ width: `${compatScore}%` }}
                  />
                </div>
                <span className="text-xs text-mystic-rose font-bold">{compatScore}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Spirit Tools 2×2 ── */}
        {zodiac && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-3 flex items-center justify-center gap-2">
              <span className="w-6 h-px bg-mystic-gold/30" /> 灵性工具 <span className="w-6 h-px bg-mystic-gold/30" />
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <SpiritToolCard icon="🌙" name="梦境解析" hint="输入梦境关键词，AI深度解读潜意识" />
              <SpiritToolCard icon="☯️" name="八字命盘" hint="四柱八字 · 紫微斗数东方命理精析" />
              <SpiritToolCard icon="🔮" name="灵摆占卜" hint="是/否问题 · 动态互动指引" />
              <SpiritToolCard icon="📅" name="能量日历" hint="月相节气 · 幸运日智能标注" />
            </div>
          </motion.div>
        )}

        {/* No zodiac hint */}
        {!zodiac && (
          <div className="text-center py-12">
            <p className="text-text-secondary text-sm">请先选择星座或在个人中心设置生辰信息</p>
            <Link
              href="/profile"
              className="inline-block mt-3 text-mystic-gold text-xs underline hover:text-mystic-rose transition-colors"
            >
              去设置 →
            </Link>
          </div>
        )}

        {/* Fortune Modal */}
        <FortuneModal
          open={fortuneModalOpen}
          zodiac={zodiac}
          period={period}
          selectedDate={selectedDate}
          onClose={() => setFortuneModalOpen(false)}
        />
      </div>
    </div>
  );
}

function LuckyCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-mystic-dark/40 border border-mystic-purple/10">
      {color && (
        <div className="w-4 h-4 rounded-full mx-auto mb-1 border border-white/20" style={{ background: color }} />
      )}
      <p className="text-[10px] text-text-tertiary">{label}</p>
      <p className="text-xs text-text-primary font-medium truncate">{value}</p>
    </div>
  );
}

function SpiritToolCard({ icon, name, hint }: { icon: string; name: string; hint: string }) {
  return (
    <div className="glass-card p-4 relative overflow-hidden cursor-pointer hover:border-mystic-gold/40 transition-colors group">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-mystic-gold/3 blur-xl pointer-events-none group-hover:bg-mystic-gold/8 transition-colors" />
      <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/25 text-mystic-gold/60">
        即将开放
      </span>
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-[13px] text-text-primary font-medium mb-1">{name}</p>
      <p className="text-[10px] text-text-tertiary leading-relaxed">{hint}</p>
    </div>
  );
}
