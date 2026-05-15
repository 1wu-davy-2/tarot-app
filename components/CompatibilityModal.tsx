"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Heart, Sparkles } from "lucide-react";

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

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface CompatibilityModalProps {
  open: boolean;
  userZodiac: string;
  selectedDate: string;
  onClose: () => void;
}

export function CompatibilityModal({ open, userZodiac, selectedDate, onClose }: CompatibilityModalProps) {
  // Form state
  const [partnerGender, setPartnerGender] = useState<"male" | "female">("female");
  const [partnerBirthYear, setPartnerBirthYear] = useState(2000);
  const [partnerBirthMonth, setPartnerBirthMonth] = useState(1);
  const [partnerBirthDay, setPartnerBirthDay] = useState(1);
  const [partnerBirthHour, setPartnerBirthHour] = useState(12);
  const [partnerBirthMinute, setPartnerBirthMinute] = useState(0);
  const [partnerBirthPlace, setPartnerBirthPlace] = useState("");
  // Result state
  const [started, setStarted] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [partnerZodiacName, setPartnerZodiacName] = useState("");
  const [compatScore, setCompatScore] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const userZodiacObj = ZODIAC_SIGNS.find(z => z.name === userZodiac);
  const partnerZodiacObj = ZODIAC_SIGNS.find(z => z.name === partnerZodiacName);

  const fetchCompatibility = useCallback(async () => {
    const birthDateStr = `${partnerBirthYear}-${String(partnerBirthMonth).padStart(2, "0")}-${String(partnerBirthDay).padStart(2, "0")}`;
    const derived = deriveZodiac(birthDateStr);
    if (!derived) {
      setError("无法识别该出生日期的星座");
      return;
    }
    setPartnerZodiacName(derived);

    // Calculate compat score
    const key1 = `${userZodiac}-${derived}`;
    const key2 = `${derived}-${userZodiac}`;
    const compatBase = COMPAT_SCORES[key1] || COMPAT_SCORES[key2] || 85;
    const score = compatBase + (hashCode(`${selectedDate}-${key1}`) % 6) - 3;
    setCompatScore(score);

    setLoading(true);
    setError("");
    setText("");
    setDone(false);
    setStarted(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const params = new URLSearchParams({
      user_zodiac: userZodiac,
      partner_zodiac: derived,
      partner_gender: partnerGender,
      partner_birth_date: birthDateStr,
      partner_birth_time: `${String(partnerBirthHour).padStart(2, "0")}:${String(partnerBirthMinute).padStart(2, "0")}`,
      partner_birth_place: partnerBirthPlace,
      date: selectedDate,
    });

    let accumulated = "";
    try {
      const url = API_BASE
        ? `${API_BASE}/api/fortune/compatibility?${params}`
        : `/api/fortune/compatibility?${params}`;
      const res = await fetch(url, { method: "POST", signal: abortRef.current.signal });

      if (!res.ok) throw new Error("Service unavailable");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            setDone(true);
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setError(parsed.error);
            } else if (parsed.content) {
              accumulated += parsed.content;
              setText(accumulated);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError("AI 服务暂时不可用");
    } finally {
      setLoading(false);
    }
  }, [userZodiac, partnerGender, partnerBirthYear, partnerBirthMonth, partnerBirthDay,
      partnerBirthHour, partnerBirthMinute, partnerBirthPlace, selectedDate]);

  const handleClose = () => {
    abortRef.current?.abort();
    setStarted(false);
    setText("");
    setError("");
    setDone(false);
    setPartnerZodiacName("");
    onClose();
  };

  const handleRetry = () => {
    setError("");
    fetchCompatibility();
  };

  // Parse AI response
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { parsed = null; }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: getDaysInMonth(partnerBirthYear, partnerBirthMonth) }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed z-50 flex flex-col max-w-lg mx-auto rounded-2xl border border-mystic-gold/30 shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 6, 18, 0.97)",
              top: "8%",
              left: "max(12px, env(safe-area-inset-left, 12px))",
              right: "max(12px, env(safe-area-inset-right, 12px))",
              maxHeight: "80dvh",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-mystic-rose" />
                <h2 className="text-xs font-cinzel text-mystic-gold">
                  {started ? "配对结果" : "星座配对 · AI合盘分析"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-mystic-purple/20 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(80dvh - 110px)" }}>
              {!started ? (
                /* ── Phase A: Form ── */
                <div className="space-y-4">
                  {/* Gender */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">对方性别</p>
                    <div className="flex items-center gap-2 p-1 rounded-full bg-mystic-dark/60 border border-mystic-purple/20 w-fit">
                      <button
                        onClick={() => setPartnerGender("male")}
                        className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                          partnerGender === "male"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        ♂ 男
                      </button>
                      <button
                        onClick={() => setPartnerGender("female")}
                        className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                          partnerGender === "female"
                            ? "bg-pink-500/20 text-pink-300 border border-pink-400/30"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        ♀ 女
                      </button>
                    </div>
                  </div>

                  {/* Birth date */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">出生日期</p>
                    <div className="flex gap-2">
                      <select
                        value={partnerBirthYear}
                        onChange={(e) => setPartnerBirthYear(Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm focus:border-mystic-gold/40 outline-none appearance-none cursor-pointer"
                      >
                        {years.map(y => <option key={y} value={y}>{y}年</option>)}
                      </select>
                      <select
                        value={partnerBirthMonth}
                        onChange={(e) => { const v = Number(e.target.value); setPartnerBirthMonth(v); if (partnerBirthDay > getDaysInMonth(partnerBirthYear, v)) setPartnerBirthDay(1); }}
                        className="w-20 px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm focus:border-mystic-gold/40 outline-none appearance-none cursor-pointer"
                      >
                        {months.map(m => <option key={m} value={m}>{m}月</option>)}
                      </select>
                      <select
                        value={partnerBirthDay}
                        onChange={(e) => setPartnerBirthDay(Number(e.target.value))}
                        className="w-20 px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm focus:border-mystic-gold/40 outline-none appearance-none cursor-pointer"
                      >
                        {days.map(d => <option key={d} value={d}>{d}日</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Birth time */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">出生时间</p>
                    <div className="flex gap-2 items-center">
                      <select
                        value={partnerBirthHour}
                        onChange={(e) => setPartnerBirthHour(Number(e.target.value))}
                        className="w-20 px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm focus:border-mystic-gold/40 outline-none appearance-none cursor-pointer"
                      >
                        {hours.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}</option>)}
                      </select>
                      <span className="text-text-tertiary text-sm">时</span>
                      <select
                        value={partnerBirthMinute}
                        onChange={(e) => setPartnerBirthMinute(Number(e.target.value))}
                        className="w-20 px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm focus:border-mystic-gold/40 outline-none appearance-none cursor-pointer"
                      >
                        {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                      </select>
                      <span className="text-text-tertiary text-sm">分</span>
                    </div>
                  </div>

                  {/* Birth place (optional) */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">出生地点 <span className="text-text-tertiary/50">(选填)</span></p>
                    <input
                      type="text"
                      value={partnerBirthPlace}
                      onChange={(e) => setPartnerBirthPlace(e.target.value)}
                      placeholder="如：北京"
                      className="w-full px-3 py-2 rounded-lg bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm placeholder:text-text-tertiary/40 focus:border-mystic-gold/40 outline-none"
                    />
                  </div>

                  {/* Validation error */}
                  {error && (
                    <p className="text-xs text-red-400/80 text-center">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={fetchCompatibility}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-rose/80 to-mystic-gold/80 border border-mystic-gold/40 text-white hover:brightness-110 transition-all text-sm font-medium"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      开始配对分析
                    </span>
                  </button>
                </div>
              ) : (
                /* ── Phase B: Results ── */
                <div className="space-y-3">
                  {/* Score header */}
                  {partnerZodiacObj && (
                    <div className="flex items-center justify-between pb-3 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{userZodiacObj?.emoji}</span>
                        <span className="text-xs text-text-secondary">{userZodiac}</span>
                        <Heart className="w-3 h-3 text-mystic-rose fill-mystic-rose/30" />
                        <span className="text-lg">{partnerZodiacObj.emoji}</span>
                        <span className="text-xs text-text-secondary">{partnerZodiacName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-mystic-rose to-mystic-gold transition-all duration-700"
                            style={{ width: `${compatScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-mystic-rose font-bold">{compatScore}%</span>
                      </div>
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <Loader2 className="w-7 h-7 text-mystic-gold animate-spin" />
                      <p className="text-[11px] text-text-tertiary">正在解读星象...</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && !loading && (
                    <div className="text-center py-6">
                      <p className="text-sm text-red-400/80">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 text-xs text-mystic-gold underline hover:text-mystic-rose transition-colors"
                      >
                        重试
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {text && (
                    <div className="space-y-3">
                      {parsed ? (
                        <>
                          {/* Summary + mood */}
                          <div className="text-center pb-3 border-b border-white/8">
                            <p className="text-base text-mystic-gold font-cinzel">{parsed.summary}</p>
                            {parsed.mood && (
                              <p className="text-[10px] text-text-tertiary mt-0.5">{parsed.mood}</p>
                            )}
                          </div>

                          {/* Compat score from AI */}
                          {parsed.compatibility_score && (
                            <div className="flex items-center justify-center gap-2 py-1">
                              <span className="text-[10px] text-text-tertiary">AI 综合评分</span>
                              <span className="text-lg font-bold text-mystic-gold font-cinzel">
                                {parsed.compatibility_score}
                              </span>
                            </div>
                          )}

                          {/* Love match */}
                          <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-400/15">
                            <p className="text-[10px] text-pink-400/60 mb-1">感情契合度</p>
                            <p className="text-xs text-text-primary leading-relaxed">{parsed.love_match}</p>
                          </div>

                          {/* Communication */}
                          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-400/15">
                            <p className="text-[10px] text-blue-400/60 mb-1">沟通模式</p>
                            <p className="text-xs text-text-primary leading-relaxed">{parsed.communication}</p>
                          </div>

                          {/* Challenges + Advice */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-400/15">
                              <p className="text-[10px] text-amber-400/60 mb-0.5">潜在挑战</p>
                              <p className="text-[11px] text-text-primary leading-relaxed">{parsed.challenges}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-400/15">
                              <p className="text-[10px] text-green-400/60 mb-0.5">相处建议</p>
                              <p className="text-[11px] text-text-primary leading-relaxed">{parsed.advice}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap text-xs text-text-primary leading-relaxed">
                          {text.split("\n").map((line, i) => (
                            <p key={i} className="mb-1">{line || " "}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-mystic-purple/20 shrink-0 text-center">
              {!started ? (
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-full bg-mystic-dark/60 border border-mystic-purple/20 text-text-secondary hover:text-text-primary transition-colors text-xs"
                >
                  取消
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/20 transition-colors text-xs"
                >
                  {done ? "关闭" : "跳过"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
