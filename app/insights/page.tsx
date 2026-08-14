"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type React from "react";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { apiGetLifeThemes, apiGenerateLifeThemes, apiGetContradictions, isLoggedIn } from "@/lib/api-client";

export default function InsightsPage() {
  const [themes, setThemes] = useState<any>(null);
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    try {
      const [t, c] = await Promise.all([
        apiGetLifeThemes(),
        apiGetContradictions(),
      ]);
      setThemes(t);
      setContradictions(c?.contradictions || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setStreamText("");
    setError("");
    await apiGenerateLifeThemes(
      (chunk) => setStreamText((p) => p + chunk),
      () => { setGenerating(false); loadData(); },
      (err) => { setError(err); setGenerating(false); },
    );
  };

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-mystic-rose/65 mb-4">登录后查看你的生命主题洞察</p>
          <Link href="/login" className="text-mystic-gold hover:underline">前往登录</Link>
        </div>
      </div>
    );
  }

  const themeIcons: Record<string, React.ReactNode> = {
    growing: <TrendingUp className="w-4 h-4 text-green-400" />,
    fading: <TrendingDown className="w-4 h-4 text-mystic-rose/60" />,
    stable: <Minus className="w-4 h-4 text-mystic-gold/60" />,
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-mystic-rose/75 hover:text-mystic-gold transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <h1 className="text-xl font-cinzel text-mystic-gold text-glow">生命主题</h1>
          <div className="w-[60px]" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div className="w-6 h-6 rounded-full border-2 border-mystic-gold border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats bar */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-mystic-rose/55">累计占卜</p>
                <p className="text-2xl font-cinzel text-mystic-gold">{themes?.reading_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-mystic-rose/55">首次记录</p>
                <p className="text-sm text-mystic-gold/80">{themes?.first_reading_date || "—"}</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || (themes?.reading_count || 0) < 3}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/30 text-mystic-gold text-xs hover:border-mystic-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                {generating ? "生成中..." : "生成洞察"}
              </button>
            </div>

            {/* Generation error */}
            {error && (
              <div className="glass-card p-4 border-mystic-rose/30 text-mystic-rose/70 text-sm">{error}</div>
            )}

            {/* Streaming output */}
            {streamText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{streamText}</pre>
              </motion.div>
            )}

            {/* Cached themes */}
            {themes?.summary && !streamText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-cinzel text-mystic-gold">最近洞察</h3>
                  <span className="text-[10px] text-mystic-rose/55">{themes.summary.generated_at?.slice(0, 10)}</span>
                </div>
                {themes.summary.themes_json?.length > 0 && (
                  <div className="space-y-3">
                    {themes.summary.themes_json.map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-mystic-dark/30 border border-mystic-purple/10">
                        <div className="mt-0.5">{themeIcons[t.strength] || themeIcons.stable}</div>
                        <div>
                          <p className="text-sm text-mystic-gold/90 font-cinzel">{t.theme}</p>
                          <p className="text-xs text-foreground/60 mt-0.5">{t.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {themes.summary.summary_text && (
                  <div className="mt-4 pt-4 border-t border-mystic-purple/20">
                    <p className="text-sm text-foreground/75 leading-relaxed">{themes.summary.summary_text}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty state */}
            {!themes?.summary && !streamText && (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 text-mystic-gold/30 mx-auto mb-3" />
                <p className="text-mystic-rose/55 text-sm">
                  {(themes?.reading_count || 0) < 3
                    ? `还需要 ${3 - (themes?.reading_count || 0)} 次占卜来解锁生命主题分析`
                    : "点击「生成洞察」开启你的生命主题分析"}
                </p>
              </div>
            )}

            {/* Contradictions */}
            {contradictions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-cinzel text-mystic-gold">矛盾检测</h3>
                <p className="text-xs text-mystic-rose/55">同类问题多次提问时，可能存在不一致的判断</p>
                {contradictions.map((c: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-mystic-dark/30 border border-mystic-rose/10 text-xs space-y-1">
                    <p className="text-foreground/70">
                      <span className="text-mystic-rose/55">{c.reading_a.date}</span> — {c.reading_a.question}
                    </p>
                    <p className="text-foreground/70">
                      <span className="text-mystic-rose/55">{c.reading_b.date}</span> — {c.reading_b.question}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
