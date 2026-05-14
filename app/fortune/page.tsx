"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import {
  generateLuckyItems, generateFortuneScores, getZodiacIndex,
  SCORE_LABELS, type LuckyItems, type FortuneScores,
} from "@/lib/fortune-data";
import { getStoredUser } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const ZODIAC_SIGNS = [
  { name: "白羊座", emoji: "♈", element: "火", dateRange: "3.21-4.19" },
  { name: "金牛座", emoji: "♉", element: "土", dateRange: "4.20-5.20" },
  { name: "双子座", emoji: "♊", element: "风", dateRange: "5.21-6.21" },
  { name: "巨蟹座", emoji: "♋", element: "水", dateRange: "6.22-7.22" },
  { name: "狮子座", emoji: "♌", element: "火", dateRange: "7.23-8.22" },
  { name: "处女座", emoji: "♍", element: "土", dateRange: "8.23-9.22" },
  { name: "天秤座", emoji: "♎", element: "风", dateRange: "9.23-10.23" },
  { name: "天蝎座", emoji: "♏", element: "水", dateRange: "10.24-11.22" },
  { name: "射手座", emoji: "♐", element: "火", dateRange: "11.23-12.21" },
  { name: "摩羯座", emoji: "♑", element: "土", dateRange: "12.22-1.19" },
  { name: "水瓶座", emoji: "♒", element: "风", dateRange: "1.20-2.18" },
  { name: "双鱼座", emoji: "♓", element: "水", dateRange: "2.19-3.20" },
];

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
  return "摩羯座"; // fallback for Dec 22-31
}

export default function FortunePage() {
  const [zodiac, setZodiac] = useState("");
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const [scores, setScores] = useState<FortuneScores | null>(null);
  const [lucky, setLucky] = useState<LuckyItems | null>(null);
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const zodiacFetched = useRef(false);

  // Init from stored user first, then try API, then derive from birth_date
  useEffect(() => {
    const u = getStoredUser();
    if (u?.zodiac && ZODIAC_SIGNS.some(z => z.name === u.zodiac)) {
      setZodiac(u.zodiac);
      return;
    }
    // Try fetching fresh profile from API (only once, guest skip)
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

  // When zodiac changes, generate scores + lucky (local)
  useEffect(() => {
    if (!zodiac) { setScores(null); setLucky(null); return; }
    setScores(generateFortuneScores(zodiac));
    setLucky(generateLuckyItems(zodiac));
    setAiText("");
    setError("");
  }, [zodiac]);

  const fetchFortune = useCallback(async () => {
    if (!zodiac) return;
    setLoading(true);
    setError("");
    setAiText("");
    let accumulated = "";

    try {
      const url = API_BASE
        ? `${API_BASE}/api/fortune/daily?zodiac=${encodeURIComponent(zodiac)}`
        : `/api/fortune/daily?zodiac=${encodeURIComponent(zodiac)}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("AI service error");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

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
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) { accumulated += parsed.content; setAiText(accumulated); }
            if (parsed.error) setError(parsed.error);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError("AI 服务暂时不可用");
    } finally {
      setLoading(false);
    }
  }, [zodiac]);

  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  // Try parsing AI JSON response
  let aiParsed: any = null;
  try { aiParsed = JSON.parse(aiText); } catch { aiParsed = null; }

  const selectedZodiac = ZODIAC_SIGNS.find(z => z.name === zodiac);

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-mystic-rose/65 hover:text-mystic-gold transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <div className="w-[60px]" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-cinzel text-mystic-gold text-glow">每日运势</h1>
          <p className="text-xs text-mystic-rose/55 mt-1">{today}</p>
        </div>

        {/* Zodiac selector */}
        <div className="mb-6 relative">
          <button
            onClick={() => setZodiacOpen(!zodiacOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-mystic-dark/60 border border-mystic-purple/20 hover:border-mystic-gold/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{selectedZodiac?.emoji || "🔮"}</span>
              <span className="text-sm text-foreground/80">{zodiac || "选择你的星座"}</span>
              {selectedZodiac && (
                <span className="text-[10px] text-mystic-rose/45">{selectedZodiac.element}象 · {selectedZodiac.dateRange}</span>
              )}
            </span>
            <span className="text-mystic-rose/45 text-xs">{zodiacOpen ? "收起" : "选择"}</span>
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
                  <span className="text-foreground/70">{z.name}</span>
                  <span className="text-[10px] text-mystic-rose/35">{z.dateRange}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Scores */}
        {scores && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-4"
          >
            <div className="flex items-center gap-4 mb-4">
              {/* Overall score ring */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={`${scores.overall * 2.64} 264`} />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#d4a853" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-mystic-gold">{scores.overall}</span>
                  <span className="text-[10px] text-mystic-rose/50">综合</span>
                </div>
              </div>
              {/* Summary text */}
              <div className="min-w-0">
                <p className="text-sm font-cinzel text-mystic-gold mb-1">今日综合运势</p>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {scores.overall >= 85 ? "运势极佳，诸事顺遂，是行动的好日子 ✨" :
                   scores.overall >= 70 ? "运势良好，保持积极心态，好运自来 🌤️" :
                   scores.overall >= 55 ? "运势平稳，适合内省沉淀，静待花开 🌙" : "需要多些耐心"}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(SCORE_LABELS).filter(([k]) => k !== "overall").map(([key, meta]) => {
                    const s = scores[key as keyof FortuneScores];
                    return (
                      <span key={key} className="text-[10px] px-2 py-0.5 rounded-full border" style={{
                        color: s >= 80 ? meta.color : undefined,
                        borderColor: s >= 80 ? meta.color + "40" : "rgba(255,255,255,0.08)",
                        opacity: s >= 80 ? 1 : 0.5,
                      }}>
                        {meta.icon} {meta.label} {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Sub-score bars */}
            <div className="space-y-2 pt-3 border-t border-mystic-purple/10">
              {Object.entries(SCORE_LABELS).filter(([k]) => k !== "overall").map(([key, meta]) => {
                const score = scores[key as keyof FortuneScores];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{meta.icon}</span>
                    <span className="text-[11px] text-foreground/70 w-14">{meta.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-mystic-dark/60 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-mystic-gold/60 to-mystic-gold transition-all duration-1000"
                        style={{ width: `${score}%`, opacity: 0.4 + score / 200 }} />
                    </div>
                    <span className="text-xs font-bold w-7 text-right" style={{ color: meta.color }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AI Fortune button */}
        {zodiac && (
          <div className="text-center mb-4">
            <button
              onClick={fetchFortune}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold transition-all text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "正在为你占卜..." : aiText ? "重新生成运势" : "AI 生成今日运势解读"}
            </button>
            {error && <p className="text-xs text-red-400/80 mt-2">{error}</p>}
          </div>
        )}

        {/* AI Fortune result */}
        {aiText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-4"
          >
            {aiParsed ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg text-mystic-gold font-cinzel">{aiParsed.summary}</p>
                  <p className="text-[10px] text-mystic-rose/45 mt-0.5">{aiParsed.mood}</p>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{aiParsed.interpretation}</p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-mystic-purple/10">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-400/15">
                    <p className="text-[10px] text-green-400/60 mb-1">行动建议</p>
                    <p className="text-xs text-foreground/80">{aiParsed.advice}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-400/15">
                    <p className="text-[10px] text-red-400/60 mb-1">避坑提醒</p>
                    <p className="text-xs text-foreground/80">{aiParsed.warning}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-foreground/85 leading-relaxed">
                {aiText.split("\n").map((line, i) => <p key={i} className="mb-1">{line || " "}</p>)}
              </div>
            )}
          </motion.div>
        )}

        {/* Lucky Items */}
        {lucky && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 mb-4"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-3 text-center">今日幸运物</h2>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
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

        {/* Energy Tasks */}
        {lucky && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 mb-4"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-3 text-center">今日能量任务</h2>
            <div className="grid grid-cols-2 gap-3">
              {lucky.tasks.map((task, i) => (
                <div key={i} className="p-3 rounded-xl bg-mystic-gold/5 border border-mystic-gold/10 text-center">
                  <span className="text-2xl block mb-1">{task.icon}</span>
                  <p className="text-xs text-mystic-gold font-cinzel">{task.title}</p>
                  <p className="text-[10px] text-foreground/50 mt-1 leading-relaxed">{task.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No zodiac hint */}
        {!zodiac && (
          <div className="text-center py-12">
            <p className="text-mystic-rose/55 text-sm">请先选择星座或在个人中心设置生辰信息</p>
            <Link
              href="/profile"
              className="inline-block mt-3 text-mystic-gold text-xs underline hover:text-mystic-rose transition-colors"
            >
              去设置 →
            </Link>
          </div>
        )}
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
      <p className="text-[10px] text-mystic-rose/45">{label}</p>
      <p className="text-[11px] text-foreground/80 font-medium truncate">{value}</p>
    </div>
  );
}
