"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Moon, Loader2, ChevronDown, ChevronUp, Star, TrendingUp } from "lucide-react";
import { getMoonPhaseEmoji } from "@/lib/astro-events";
import { searchDreamSymbols, CATEGORY_ICONS } from "@/lib/dream-dictionary";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const MOOD_EMOJI_MAP = ["", "😴", "😰", "😐", "🙂", "😊"];

interface Dream {
  id: number;
  date: string;
  dream_text: string;
  ai_response: string | null;
  moon_phase: string;
  mood: number | null;
  tags: string[];
  created_at: string | null;
}

export default function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("tarot_token");
    if (!token) {
      setError("请先登录");
      setLoading(false);
      return;
    }
    const url = API_BASE ? `${API_BASE}/api/fortune/dreams` : "/api/fortune/dreams";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setDreams(data.dreams || []);
        setLoading(false);
      })
      .catch(() => {
        setError("加载失败");
        setLoading(false);
      });
  }, []);

  const parseAiResponse = (aiResponse: string | null) => {
    if (!aiResponse) return null;
    try { return JSON.parse(aiResponse); } catch { return null; }
  };

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/fortune"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回运势</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-cinzel text-mystic-gold text-glow">梦境日记</h1>
          <div className="w-[60px]" />
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-2 py-20">
            <Loader2 className="w-6 h-6 text-mystic-gold animate-spin" />
            <p className="text-xs text-text-tertiary">加载中...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-text-secondary text-sm">{error}</p>
            <Link href="/login" className="inline-block mt-3 text-mystic-gold text-xs underline">
              去登录 →
            </Link>
          </div>
        )}

        {!loading && !error && dreams.length === 0 && (
          <div className="text-center py-20">
            <Moon className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-30" />
            <p className="text-text-secondary text-sm">还没有解梦记录</p>
            <p className="text-[11px] text-text-tertiary mt-1">去运势页点击「梦境解析」开始记录你的第一个梦</p>
            <Link
              href="/fortune"
              className="inline-block mt-3 text-mystic-gold text-xs underline hover:text-mystic-rose transition-colors"
            >
              前往运势 →
            </Link>
          </div>
        )}

        {/* Dream list */}
        {dreams.length > 0 && (
          <div className="space-y-3">
            {dreams.map((dream) => {
              const parsed = parseAiResponse(dream.ai_response);
              const symbols = searchDreamSymbols(dream.dream_text);
              const isExpanded = expandedId === dream.id;
              const moonEmoji = getMoonPhaseEmoji(new Date(dream.date + "T12:00:00"));

              return (
                <motion.div
                  key={dream.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  {/* Summary row — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dream.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-mystic-purple/5 transition-colors"
                  >
                    <span className="text-lg shrink-0">{moonEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-text-tertiary">{dream.date}</span>
                        {dream.mood && (
                          <span className="text-sm">{MOOD_EMOJI_MAP[dream.mood]}</span>
                        )}
                        <span className="text-[10px] text-text-tertiary">{dream.moon_phase}</span>
                      </div>
                      <p className="text-xs text-text-primary truncate">
                        {parsed?.title || dream.dream_text.slice(0, 30)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {dream.tags.filter(Boolean).map((tag, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-tertiary shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
                    )}
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                          {/* Original dream text */}
                          <div>
                            <p className="text-[10px] text-text-tertiary mb-1">梦境描述</p>
                            <p className="text-xs text-text-primary leading-relaxed bg-mystic-dark/40 rounded-lg p-2.5">
                              {dream.dream_text}
                            </p>
                          </div>

                          {/* AI Interpretation */}
                          {parsed && (
                            <>
                              <div>
                                <p className="text-[10px] text-text-tertiary mb-1">AI 解读</p>
                                <p className="text-xs text-text-primary leading-relaxed">{parsed.interpretation}</p>
                              </div>

                              {parsed.symbols && (
                                <div>
                                  <p className="text-[10px] text-text-tertiary mb-1">关键象征</p>
                                  <p className="text-xs text-text-secondary">{parsed.symbols}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                {parsed.positive_ratio != null && (
                                  <div className="p-2 rounded-lg bg-mystic-dark/40">
                                    <p className="text-[10px] text-text-tertiary mb-0.5">运势偏向</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                                          style={{ width: `${parsed.positive_ratio}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10px] font-bold ${
                                        parsed.positive_ratio >= 60 ? "text-green-400" : "text-red-400"
                                      }`}>{parsed.positive_ratio}%</span>
                                    </div>
                                  </div>
                                )}
                                {parsed.dream_trend && parsed.dream_trend !== "首条记录" && (
                                  <div className="p-2 rounded-lg bg-mystic-dark/40">
                                    <p className="text-[10px] text-text-tertiary mb-0.5">梦境趋势</p>
                                    <p className="text-[10px] text-text-secondary">{parsed.dream_trend}</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {/* Zhou Gong symbols */}
                          {symbols.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Star className="w-3 h-3 text-mystic-gold" />
                                <p className="text-[10px] text-text-tertiary">周公解梦</p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {symbols.map((sym, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      sym.lucky === "吉"
                                        ? "bg-green-500/10 text-green-400 border border-green-400/20"
                                        : sym.lucky === "凶"
                                        ? "bg-red-500/10 text-red-400 border border-red-400/20"
                                        : "bg-gray-500/10 text-gray-400 border border-gray-400/20"
                                    }`}
                                  >
                                    {CATEGORY_ICONS[sym.category]} {sym.keyword} · {sym.lucky}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
