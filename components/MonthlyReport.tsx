"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Loader2, RefreshCw, X, BarChart3, PieChart } from "lucide-react";
import { apiGenerateMonthlyReport } from "@/lib/api-client";
import { tarotCards } from "@/lib/tarot-data";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ELEMENT_COLORS: Record<string, string> = {
  "火": "#ef4444", "风": "#fbbf24", "水": "#3b82f6", "土": "#22c55e",
  "Fire / 火元素": "#ef4444", "Air / 风元素": "#fbbf24", "Water / 水元素": "#3b82f6", "Earth / 土元素": "#22c55e",
};

const MOOD_LABELS: Record<number, string> = { 1: "开心", 2: "难过", 3: "生气", 4: "焦虑", 5: "思考" };
const ELEMENT_CN: Record<string, string> = { "火": "火", "风": "风", "水": "水", "土": "土" };

interface MonthlyReportProps {
  month: string;
  monthLabel: string;
  entryCount: number;
  entries: Array<{ date: string; cardId: number; isReversed: boolean; mood?: number }>;
}

export default function MonthlyReport({ month, monthLabel, entryCount, entries }: MonthlyReportProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setReport("");
    setExpanded(true);
    await apiGenerateMonthlyReport(
      month,
      (chunk) => setReport((prev) => prev + chunk),
      () => setLoading(false),
      (msg) => { setError(msg); setLoading(false); },
    );
  };

  useEffect(() => {
    if (expanded && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expanded, report]);

  // Compute chart data from entries
  const elementChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      const card = tarotCards[e.cardId];
      const el = ELEMENT_CN[card?.element || ""] || "未知";
      counts[el] = (counts[el] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const moodChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (e.mood) {
        const label = MOOD_LABELS[e.mood];
        counts[label] = (counts[label] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  return (
    <div className="glass-card mb-6 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left hover:bg-mystic-purple/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-mystic-gold" />
          </div>
          <div>
            <p className="text-sm font-cinzel text-mystic-gold">月度趋势报告</p>
            <p className="text-[10px] text-text-secondary mt-0.5">{monthLabel} · {entryCount} 天记录</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div ref={reportRef} className="px-5 pb-5 border-t border-mystic-purple/10">
              {!report && !loading && !error && (
                <div className="pt-5 text-center">
                  <p className="text-xs text-text-secondary mb-4">AI 将综合分析你本月的日记数据，生成深度趋势报告</p>
                  <button
                    onClick={handleGenerate}
                    disabled={entryCount < 7}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose text-white text-sm font-cinzel tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    生成月报
                  </button>
                  {entryCount < 7 && (
                    <p className="text-[10px] text-text-tertiary mt-2">至少需要 7 天记录才能生成月报</p>
                  )}
                </div>
              )}

              {loading && (
                <div className="pt-5 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-mystic-gold animate-spin" />
                  <p className="text-xs text-text-secondary">AI 正在深度分析本月数据...</p>
                </div>
              )}

              {report && (
                <div className="pt-4">
                  {/* Charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    {elementChartData.length > 0 && (
                      <div className="glass-card p-3">
                        <p className="text-[10px] text-text-secondary mb-2 flex items-center gap-1">
                          <PieChart className="w-3 h-3" /> 牌面元素分布
                        </p>
                        <ResponsiveContainer width="100%" height={140}>
                          <RePieChart>
                            <Pie data={elementChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                              {elementChartData.map((d) => (
                                <Cell key={d.name} fill={ELEMENT_COLORS[d.name] || "#888"} stroke="transparent" />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1a0f2e", border: "1px solid #2d1b69", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#c084fc" }} />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 mt-1">
                          {elementChartData.map((d) => (
                            <span key={d.name} className="text-[10px] text-text-secondary" style={{ color: ELEMENT_COLORS[d.name] }}>
                              {d.name} {d.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {moodChartData.length > 0 && (
                      <div className="glass-card p-3">
                        <p className="text-[10px] text-text-secondary mb-2 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> 心情变化
                        </p>
                        <ResponsiveContainer width="100%" height={140}>
                          <BarChart data={moodChartData}>
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#c084fc50" }} axisLine={false} tickLine={false} />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                              {moodChartData.map((_, i) => (
                                <Cell key={i} fill="#d4a853" fillOpacity={0.6} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Text report */}
                  <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {renderMarkdown(report)}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-mystic-purple/10">
                    <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-1.5 text-[10px] text-text-secondary hover:text-mystic-rose transition-colors disabled:opacity-30">
                      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> 重新生成
                    </button>
                    <button onClick={() => setExpanded(false)} className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" /> 收起
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="pt-5 text-center">
                  <p className="text-xs text-red-400/60 mb-3">{error}</p>
                  <button onClick={handleGenerate} className="text-[10px] text-text-secondary hover:text-mystic-rose transition-colors">重试</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="text-mystic-gold font-cinzel text-sm mt-4 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-mystic-gold font-cinzel text-base mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-mystic-gold font-cinzel text-lg mt-5 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-text-primary text-sm">{line.slice(2)}</li>;
    if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 text-text-primary text-sm list-decimal">{line.replace(/^\d+\. /, "")}</li>;
    if (line.trim() === "") return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) return <p key={i} className="text-sm text-text-primary my-1">{parts.map((p, j) => p.startsWith("**") ? <strong key={j} className="text-mystic-gold">{p.slice(2, -2)}</strong> : p)}</p>;
    return <p key={i} className="text-sm text-text-primary my-1">{line}</p>;
  });
}
