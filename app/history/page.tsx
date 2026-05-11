"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Trash2, ChevronDown, X, Clock, Layers } from "lucide-react";
import { getReadings, deleteReading, clearReadings, type ReadingRecord } from "@/lib/reading-history";

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReadings(getReadings());
    setLoaded(true);
  }, []);

  const handleDelete = (id: string) => {
    deleteReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    clearReadings();
    setReadings([]);
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-mystic-rose/50 hover:text-mystic-rose transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-cinzel text-mystic-gold text-glow">解读历史</h1>
          <p className="text-mystic-rose/50 text-sm mt-2">过往的每一次占卜，都是命运的低语</p>
        </motion.div>

        {!loaded && (
          <div className="text-center py-20">
            <p className="text-mystic-rose/40 text-sm">加载中...</p>
          </div>
        )}

        {loaded && readings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-mystic-rose/40 text-sm mb-4">还没有解读记录</p>
            <Link
              href="/spread"
              className="text-mystic-gold text-sm underline hover:text-mystic-rose transition-colors"
            >
              去进行一次占卜
            </Link>
          </motion.div>
        )}

        {readings.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-mystic-rose/40">共 {readings.length} 条记录</span>
              <button
                onClick={handleClearAll}
                className="text-xs text-mystic-rose/30 hover:text-mystic-rose/70 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                清空全部
              </button>
            </div>

            {readings.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Header — always visible */}
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full p-4 text-left hover:bg-mystic-purple/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-mystic-purple/20 flex items-center justify-center">
                        <span className="text-lg">
                          {r.cards.length === 1 ? "🃏" : "✨"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-cinzel text-mystic-gold/90 truncate">
                          {r.spreadType}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-mystic-rose/40">
                            {new Date(r.date).toLocaleDateString("zh-CN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-[10px] text-mystic-rose/30">
                            <Layers className="w-3 h-3 inline mr-0.5" />{r.cards.length}张
                          </span>
                        </div>
                        {r.question && (
                          <p className="text-[11px] text-foreground/50 italic truncate mt-1">
                            "{r.question}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="text-mystic-rose/20 hover:text-mystic-rose/60 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 text-mystic-rose/30 transition-transform duration-200 ${
                          expandedId === r.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedId === r.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-mystic-purple/10">
                        {/* Cards */}
                        <div className="flex flex-wrap gap-3 py-4">
                          {r.cards.map((c, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-1.5"
                            >
                              <div className="relative w-16 h-24 rounded-lg overflow-hidden border border-mystic-purple/20">
                                <img
                                  src={c.imageUrl}
                                  alt={c.nameCN}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-mystic-gold/70 font-cinzel max-w-[4rem] text-center leading-tight">
                                {c.nameCN}
                              </span>
                              <span className={`text-[9px] ${c.isReversed ? "text-mystic-rose/50" : "text-mystic-gold/50"}`}>
                                {c.isReversed ? "逆" : "正"}
                              </span>
                              <span className="text-[9px] text-mystic-rose/30 text-center max-w-[4rem] leading-tight">
                                {c.position}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Interpretation text */}
                        {r.standardInterpretation && (
                          <div className="border-t border-mystic-purple/10 pt-3">
                            <p className="text-[10px] text-mystic-rose/40 mb-2">
                              {r.aiInterpretation ? "📖 标准解读" : "📖 解读内容"}
                            </p>
                            <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                              {r.standardInterpretation}
                            </p>
                          </div>
                        )}

                        {r.aiInterpretation && (
                          <div className="border-t border-mystic-purple/10 pt-3 mt-3">
                            <p className="text-[10px] text-mystic-rose/40 mb-2">🔮 AI 深度解读</p>
                            <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                              {r.aiInterpretation}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
