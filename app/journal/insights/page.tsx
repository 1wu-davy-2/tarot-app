"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BarChart3, Calendar, FileText, Sparkles } from "lucide-react";
import { apiGetCardMoodCorrelation, apiGetTimePatterns, apiGenerateAnnualReport, apiGetCachedInsight, isLoggedIn } from "@/lib/api-client";

export default function JournalInsightsPage() {
  const [tab, setTab] = useState<"card-mood" | "time" | "annual">("card-mood");
  const [cardMood, setCardMood] = useState<any>(null);
  const [timePatterns, setTimePatterns] = useState<any>(null);
  const [annualCached, setAnnualCached] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");

  const loadTabData = useCallback(async (t: string) => {
    if (!isLoggedIn()) return;
    setLoading(true);
    try {
      if (t === "card-mood") {
        setCardMood(await apiGetCardMoodCorrelation(3));
      } else if (t === "time") {
        setTimePatterns(await apiGetTimePatterns(3));
      } else if (t === "annual") {
        setAnnualCached(await apiGetCachedInsight("annual_report"));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadTabData(tab); }, [tab, loadTabData]);

  const handleGenerateAnnual = async () => {
    setGenerating(true);
    setStreamText("");
    setError("");
    await apiGenerateAnnualReport(
      new Date().getFullYear(),
      (chunk) => setStreamText((p) => p + chunk),
      () => { setGenerating(false); loadTabData("annual"); },
      (err) => { setError(err); setGenerating(false); },
    );
  };

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-mystic-rose/65 mb-4">登录后查看日记洞察</p>
          <Link href="/login" className="text-mystic-gold hover:underline">前往登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/journal" className="inline-flex items-center gap-1.5 text-mystic-rose/75 hover:text-mystic-gold transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回日记</span>
          </Link>
          <h1 className="text-xl font-cinzel text-mystic-gold text-glow">日记洞察</h1>
          <div className="w-[60px]" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mystic-purple/20 mb-6">
          {[
            ["card-mood", "卡牌·情绪"],
            ["time", "时间模式"],
            ["annual", "年度报告"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex-1 py-3 text-xs transition-colors border-b-2 -mb-[1px] ${
                tab === key ? "border-mystic-gold text-mystic-gold" : "border-transparent text-foreground/55 hover:text-foreground/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div className="w-6 h-6 rounded-full border-2 border-mystic-gold border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : (
          <>
            {/* Tab: Card-Mood Correlation */}
            {tab === "card-mood" && (
              <div className="space-y-4">
                {!cardMood || cardMood.cards?.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-10 h-10 text-mystic-gold/30 mx-auto mb-3" />
                    <p className="text-mystic-rose/55 text-sm">日记数据不足，记录更多天后来查看卡牌与情绪的关系</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-mystic-rose/55">
                      近3个月 · {cardMood.total_days} 天记录
                    </p>
                    {cardMood.cards.slice(0, 12).map((c: any, i: number) => (
                      <div key={i} className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-mystic-dark/50 border border-mystic-purple/20 flex items-center justify-center text-sm font-cinzel text-mystic-gold">
                          #{c.card_id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground/80">{c.is_reversed ? "逆位" : "正位"} · 出现{c.count}次</span>
                            <span className="text-xs text-mystic-gold/80">均分 {c.avg_mood}</span>
                          </div>
                          <div className="h-2 bg-mystic-dark/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-mystic-rose/60 via-mystic-gold/60 to-green-400/60"
                              style={{ width: `${(c.avg_mood / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Tab: Time Patterns */}
            {tab === "time" && (
              <div className="space-y-4">
                {!timePatterns || timePatterns.total_entries === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-mystic-gold/30 mx-auto mb-3" />
                    <p className="text-mystic-rose/55 text-sm">日记数据不足</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-mystic-rose/55">
                      近3个月 · {timePatterns.total_entries} 条记录
                    </p>
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-cinzel text-mystic-gold mb-4">周间情绪分布</h3>
                      <div className="space-y-2">
                        {timePatterns.by_weekday.map((d: any) => (
                          <div key={d.day} className="flex items-center gap-3">
                            <span className="text-xs text-mystic-rose/65 w-10">{d.day_name}</span>
                            <div className="flex-1 h-5 bg-mystic-dark/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  timePatterns.lowest_day?.day === d.day ? "bg-mystic-rose/50" :
                                  timePatterns.highest_day?.day === d.day ? "bg-green-400/50" :
                                  "bg-mystic-gold/30"
                                }`}
                                style={{ width: `${Math.max((d.avg_mood / 5) * 100, 4)}%` }}
                              />
                            </div>
                            <span className="text-xs text-foreground/60 w-8 text-right">{d.avg_mood}</span>
                          </div>
                        ))}
                      </div>
                      {timePatterns.lowest_day && (
                        <p className="text-xs text-mystic-rose/65 mt-3">
                          情绪最低：{timePatterns.lowest_day.day_name} ({timePatterns.lowest_day.avg_mood})
                        </p>
                      )}
                      {timePatterns.highest_day && (
                        <p className="text-xs text-green-400/65 mt-1">
                          情绪最高：{timePatterns.highest_day.day_name} ({timePatterns.highest_day.avg_mood})
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Annual Report */}
            {tab === "annual" && (
              <div className="space-y-4">
                {annualCached?.cached ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-cinzel text-mystic-gold">{annualCached.cached.result.title}</h3>
                      <p className="text-xs text-mystic-rose/55 mt-1">{annualCached.cached.period}</p>
                    </div>
                    {annualCached.cached.result.year_card_name && (
                      <div className="text-center p-4 bg-mystic-dark/30 rounded-lg">
                        <Sparkles className="w-5 h-5 text-mystic-gold mx-auto mb-2" />
                        <p className="text-xs text-mystic-rose/55">年度之牌</p>
                        <p className="text-lg font-cinzel text-mystic-gold">{annualCached.cached.result.year_card_name}</p>
                        <p className="text-xs text-foreground/60 mt-1">{annualCached.cached.result.year_card_reason}</p>
                      </div>
                    )}
                    {annualCached.cached.result.core_themes && (
                      <div className="flex flex-wrap gap-2">
                        {annualCached.cached.result.core_themes.map((theme: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-xs text-mystic-gold/80">{theme}</span>
                        ))}
                      </div>
                    )}
                    {annualCached.cached.result.emotional_arc && (
                      <p className="text-sm text-foreground/70">{annualCached.cached.result.emotional_arc}</p>
                    )}
                    {annualCached.cached.result.growth && (
                      <div className="pt-4 border-t border-mystic-purple/20">
                        <p className="text-xs text-mystic-rose/55 mb-1">成长与蜕变</p>
                        <p className="text-sm text-foreground/75">{annualCached.cached.result.growth}</p>
                      </div>
                    )}
                    {annualCached.cached.result.message && (
                      <div className="text-center pt-4 border-t border-mystic-gold/10">
                        <p className="text-sm font-cinzel text-mystic-gold italic">&ldquo;{annualCached.cached.result.message}&rdquo;</p>
                      </div>
                    )}
                  </motion.div>
                ) : streamText ? (
                  <div className="glass-card p-5">
                    <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{streamText}</pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-mystic-gold/30 mx-auto mb-3" />
                    <p className="text-mystic-rose/55 text-sm mb-4">生成你的年度灵魂报告</p>
                    <button
                      onClick={handleGenerateAnnual}
                      disabled={generating}
                      className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold disabled:opacity-40 transition-all text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      {generating ? "生成中..." : "生成年度报告"}
                    </button>
                    {error && <p className="text-mystic-rose/65 text-xs mt-3">{error}</p>}
                  </div>
                )}
                {!annualCached?.cached && !generating && !streamText && (
                  <button
                    onClick={handleGenerateAnnual}
                    disabled={generating}
                    className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold disabled:opacity-40 transition-all text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generating ? "生成中..." : "生成年度报告"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
