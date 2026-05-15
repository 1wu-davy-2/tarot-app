"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Loader2, Sparkles, Moon, Star, BookOpen, ChevronRight, TrendingUp } from "lucide-react";
import { getMoonPhaseName, getMoonPhaseEmoji } from "@/lib/astro-events";
import { searchDreamSymbols, CATEGORY_ICONS, type DreamSymbol } from "@/lib/dream-dictionary";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const MOOD_EMOJIS = ["😴", "😰", "😐", "🙂", "😊"];
const MOOD_LABELS = ["记不清", "有些不安", "平静", "还不错", "很美好"];
const MOOD_EMOJI_MAP = ["", "😴", "😰", "😐", "🙂", "😊"];

interface RecentDream {
  id: number;
  date: string;
  dream_text: string;
  moon_phase: string;
  mood: number | null;
  tags: string[];
}

interface DreamModalProps {
  open: boolean;
  zodiac: string;
  selectedDate: string;
  onClose: () => void;
}

export function DreamModal({ open, zodiac, selectedDate, onClose }: DreamModalProps) {
  const router = useRouter();
  // Form state
  const [dreamText, setDreamText] = useState("");
  const [mood, setMood] = useState(0);
  // Result state
  const [started, setStarted] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [dreamSymbols, setDreamSymbols] = useState<DreamSymbol[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  // History
  const [recentDreams, setRecentDreams] = useState<RecentDream[]>([]);
  const [dreamTotal, setDreamTotal] = useState(0);

  const moonPhase = getMoonPhaseName(new Date(selectedDate + "T12:00:00"));
  const moonEmoji = getMoonPhaseEmoji(new Date(selectedDate + "T12:00:00"));

  // Fetch recent dreams on open
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("tarot_token");
    if (!token) return;
    const url = API_BASE
      ? `${API_BASE}/api/fortune/dreams/recent?limit=3`
      : "/api/fortune/dreams/recent?limit=3";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setRecentDreams(data.dreams || []);
        setDreamTotal(data.total || 0);
      })
      .catch(() => {});
  }, [open]);

  const handleStartDream = useCallback(async () => {
    if (!dreamText.trim() || loading) return;
    const trimmed = dreamText.trim();

    // Match Zhou Gong symbols immediately
    const symbols = searchDreamSymbols(trimmed);
    setDreamSymbols(symbols);

    setLoading(true);
    setError("");
    setText("");
    setDone(false);
    setStarted(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const params = new URLSearchParams({
      dream_text: trimmed,
      moon_phase: moonPhase,
      zodiac: zodiac || "",
      mood: String(mood),
      date: selectedDate,
      recent_ids: recentDreams.map(d => d.id).join(","),
    });

    let accumulated = "";
    try {
      const url = API_BASE
        ? `${API_BASE}/api/fortune/dream?${params}`
        : `/api/fortune/dream?${params}`;
      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const t = localStorage.getItem("tarot_token");
        if (t) headers["Authorization"] = `Bearer ${t}`;
      }
      const res = await fetch(url, { method: "POST", signal: abortRef.current.signal, headers });

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
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          const data = trimmedLine.slice(6);
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
  }, [dreamText, mood, moonPhase, zodiac, selectedDate, recentDreams, loading]);

  const handleClose = () => {
    abortRef.current?.abort();
    setStarted(false);
    setText("");
    setError("");
    setDone(false);
    setDreamText("");
    setMood(0);
    setDreamSymbols([]);
    onClose();
  };

  // Parse AI response
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { parsed = null; }

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
              top: "6%",
              left: "max(12px, env(safe-area-inset-left, 12px))",
              right: "max(12px, env(safe-area-inset-right, 12px))",
              maxHeight: "85dvh",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-mystic-gold" />
                <h2 className="text-xs font-cinzel text-mystic-gold">
                  {started ? "梦境解读" : "梦境解析 · AI 解梦"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Dream journal link — always visible */}
                {!started && (
                  <button
                    onClick={() => { handleClose(); router.push("/dreams"); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-mystic-dark/40 border border-mystic-purple/20 text-text-tertiary hover:text-mystic-gold hover:border-mystic-gold/30 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    梦境日记{dreamTotal > 0 ? ` · ${dreamTotal}` : ""}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-mystic-purple/20 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(85dvh - 110px)" }}>
              {!started ? (
                /* ── Phase A: Input ── */
                <div className="space-y-4">
                  {/* Moon phase context */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-mystic-dark/40 border border-mystic-purple/15">
                    <span className="text-2xl">{moonEmoji}</span>
                    <div>
                      <p className="text-xs text-text-primary font-medium">{moonPhase}之夜</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {moonPhase === "满月" ? "满月之夜梦境最活跃，潜意识信息最强烈" :
                         moonPhase === "新月" ? "新月适合开启新计划，梦境可能预示未来方向" :
                         moonPhase === "残月" || moonPhase === "亏月" ? "能量回收期，梦境揭示需要放下的事物" :
                         "记录你的梦境，探索潜意识的信息"}
                      </p>
                    </div>
                    {zodiac && (
                      <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold/70">
                        {zodiac}
                      </span>
                    )}
                  </div>

                  {/* Recent dreams preview — always visible */}
                  {recentDreams.length > 0 ? (
                    <div className="p-3 rounded-xl bg-mystic-dark/40 border border-mystic-purple/20">
                      <span className="text-[10px] text-text-tertiary">最近梦境</span>
                      {recentDreams.slice(0, 2).map((d, i) => {
                        const title = d.dream_text.length > 20 ? d.dream_text.slice(0, 20) + "..." : d.dream_text;
                        return (
                          <div key={d.id} className="flex items-center gap-2 text-[11px] py-1 mt-1 border-b border-white/5 last:border-b-0">
                            <span className="text-text-tertiary w-14 shrink-0">{d.date.slice(5)}</span>
                            <span className="text-text-secondary truncate flex-1">{title}</span>
                            {d.mood && <span className="text-sm shrink-0">{MOOD_EMOJI_MAP[d.mood]}</span>}
                            <span className="text-[10px] text-text-tertiary">{d.moon_phase}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-mystic-dark/30 border border-mystic-purple/10 border-dashed text-center">
                      <p className="text-[10px] text-text-tertiary">🌙 暂无解梦记录 · 开始记录你的第一个梦吧</p>
                    </div>
                  )}

                  {/* Dream textarea */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">描述你的梦境</p>
                    <textarea
                      value={dreamText}
                      onChange={(e) => setDreamText(e.target.value)}
                      placeholder="我梦见..."
                      maxLength={2000}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-mystic-dark/60 border border-mystic-purple/20 text-text-primary text-sm placeholder:text-text-tertiary/40 focus:border-mystic-gold/40 outline-none resize-none"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1 text-right">{dreamText.length}/2000</p>
                  </div>

                  {/* Mood selector */}
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">醒来时的情绪</p>
                    <div className="flex gap-2">
                      {MOOD_EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setMood(i + 1)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-sm transition-all ${
                            mood === i + 1
                              ? "bg-mystic-gold/15 border border-mystic-gold/30"
                              : "bg-mystic-dark/40 border border-mystic-purple/10 hover:border-mystic-purple/25"
                          }`}
                        >
                          <span className="text-lg">{emoji}</span>
                          <span className="text-[9px] text-text-tertiary">{MOOD_LABELS[i]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Validation error */}
                  {error && (
                    <p className="text-xs text-red-400/80 text-center">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleStartDream}
                    disabled={!dreamText.trim()}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple/80 to-indigo-600/80 border border-mystic-gold/40 text-white hover:brightness-110 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      开始解梦
                    </span>
                  </button>
                </div>
              ) : (
                /* ── Phase B: Results ── */
                <div className="space-y-3">
                  {/* Loading */}
                  {loading && (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <Loader2 className="w-7 h-7 text-mystic-gold animate-spin" />
                      <p className="text-[11px] text-text-tertiary">正在解读你的梦境...</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && !loading && (
                    <div className="text-center py-6">
                      <p className="text-sm text-red-400/80">{error}</p>
                      <button
                        onClick={handleStartDream}
                        className="mt-2 text-xs text-mystic-gold underline hover:text-mystic-rose transition-colors"
                      >
                        重试
                      </button>
                    </div>
                  )}

                  {/* AI Content */}
                  {text && (
                    <div className="space-y-3">
                      {parsed ? (
                        <>
                          {/* Title + mood + ratio bar */}
                          <div className="text-center pb-3 border-b border-white/8">
                            <p className="text-base text-mystic-gold font-cinzel">{parsed.title}</p>
                            {parsed.mood && (
                              <p className="text-[10px] text-text-tertiary mt-0.5">{parsed.mood}</p>
                            )}
                            {/* Positive/Negative ratio bar */}
                            {parsed.positive_ratio != null && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-green-400/70">积极</span>
                                  <span className="text-text-primary font-medium">
                                    运势偏向：<span className={parsed.positive_ratio >= 60 ? "text-green-400" : parsed.positive_ratio >= 40 ? "text-amber-400" : "text-red-400"}>
                                      {parsed.positive_ratio >= 60 ? "吉" : parsed.positive_ratio >= 40 ? "平" : "凶"}
                                    </span> {parsed.positive_ratio}%
                                  </span>
                                  <span className="text-red-400/70">消极</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/8 overflow-hidden flex">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-500/60 to-green-400 transition-all duration-700"
                                    style={{ width: `${parsed.positive_ratio}%` }}
                                  />
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-red-400/60 to-red-500/40 transition-all duration-700"
                                    style={{ width: `${100 - parsed.positive_ratio}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Interpretation */}
                          <div className="p-3 rounded-lg bg-mystic-purple/5 border border-mystic-purple/15">
                            <p className="text-[10px] text-mystic-purple/60 mb-1">整体解读</p>
                            <p className="text-xs text-text-primary leading-relaxed">{parsed.interpretation}</p>
                          </div>

                          {/* Symbols */}
                          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-400/15">
                            <p className="text-[10px] text-amber-400/60 mb-1">关键象征</p>
                            <p className="text-xs text-text-primary leading-relaxed">{parsed.symbols}</p>
                          </div>

                          {/* Subconscious + Advice */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-400/15">
                              <p className="text-[10px] text-blue-400/60 mb-0.5">潜意识映射</p>
                              <p className="text-[11px] text-text-primary leading-relaxed">{parsed.subconscious}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-400/15">
                              <p className="text-[10px] text-green-400/60 mb-0.5">行动建议</p>
                              <p className="text-[11px] text-text-primary leading-relaxed">{parsed.advice}</p>
                            </div>
                          </div>

                          {/* Dual actions: positive + negative */}
                          {(parsed.positive_action || parsed.negative_action) && (
                            <div className="grid grid-cols-2 gap-2.5 pt-2">
                              {parsed.positive_action && (
                                <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-400/20">
                                  <p className="text-[10px] text-green-400/60 mb-1">✨ 正向利用</p>
                                  <p className="text-[11px] text-text-primary leading-relaxed">{parsed.positive_action}</p>
                                </div>
                              )}
                              {parsed.negative_action && (
                                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-400/20">
                                  <p className="text-[10px] text-amber-400/60 mb-1">⚠️ 化解建议</p>
                                  <p className="text-[11px] text-text-primary leading-relaxed">{parsed.negative_action}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Dream trend */}
                          {parsed.dream_trend && parsed.dream_trend !== "首条记录" && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-mystic-purple/5 border border-mystic-purple/10">
                              <TrendingUp className="w-3.5 h-3.5 text-mystic-gold/60" />
                              <p className="text-[11px] text-text-secondary leading-relaxed">
                                <span className="text-[10px] text-text-tertiary">梦境趋势 · </span>
                                {parsed.dream_trend}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap text-xs text-text-primary leading-relaxed">
                          {text.split("\n").map((line, i) => (
                            <p key={i} className="mb-1">{line || " "}</p>
                          ))}
                        </div>
                      )}

                      {/* ── Zhou Gong Dream Dictionary matches ── */}
                      {dreamSymbols.length > 0 && (
                        <div className="pt-3 border-t border-white/8">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-3.5 h-3.5 text-mystic-gold" />
                            <p className="text-xs font-cinzel text-mystic-gold">周公解梦</p>
                            <span className="text-[10px] text-text-tertiary">传统经典解读</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {dreamSymbols.map((sym, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-lg border ${
                                  sym.lucky === "吉"
                                    ? "bg-green-500/5 border-green-400/20"
                                    : sym.lucky === "凶"
                                    ? "bg-red-500/5 border-red-400/20"
                                    : "bg-gray-500/5 border-gray-400/20"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs">{CATEGORY_ICONS[sym.category] || "🔮"}</span>
                                  <span className="text-xs text-text-primary font-medium">{sym.keyword}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                    sym.lucky === "吉"
                                      ? "bg-green-500/15 text-green-400"
                                      : sym.lucky === "凶"
                                      ? "bg-red-500/15 text-red-400"
                                      : "bg-gray-500/15 text-gray-400"
                                  }`}>
                                    {sym.lucky}
                                  </span>
                                </div>
                                <p className="text-[10px] text-text-secondary leading-relaxed">{sym.meaning}</p>
                              </div>
                            ))}
                          </div>
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
