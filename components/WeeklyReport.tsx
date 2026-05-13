"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Loader2, RefreshCw, X } from "lucide-react";
import { apiGenerateWeeklyReport } from "@/lib/api-client";

interface WeeklyReportProps {
  startDate: string;
  endDate: string;
  entryCount: number;
  weekLabel: string;
}

export default function WeeklyReport({
  startDate,
  endDate,
  entryCount,
  weekLabel,
}: WeeklyReportProps) {
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

    await apiGenerateWeeklyReport(
      startDate,
      endDate,
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

  return (
    <div className="glass-card mb-6 overflow-hidden">
      {/* Banner */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left hover:bg-mystic-purple/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-mystic-gold" />
          </div>
          <div>
            <p className="text-sm font-cinzel text-mystic-gold">本周塔罗周报</p>
            <p className="text-[10px] text-mystic-rose/55 mt-0.5">{weekLabel} · {entryCount} 天记录</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-mystic-rose/45 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div ref={reportRef} className="px-5 pb-5 border-t border-mystic-purple/10">
              {/* Generate button (when no report yet) */}
              {!report && !loading && !error && (
                <div className="pt-5 text-center">
                  <p className="text-xs text-foreground/65 mb-4">
                    AI 将综合分析你本周的日记记录与星盘信息，生成一份个性化的塔罗周报
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={entryCount < 3}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose text-white text-sm font-cinzel tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    生成周报
                  </button>
                  {entryCount < 3 && (
                    <p className="text-[10px] text-mystic-rose/45 mt-2">
                      至少需要 3 天日记记录才能生成周报
                    </p>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="pt-5 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-mystic-gold animate-spin" />
                  <p className="text-xs text-mystic-rose/55">AI 正在分析你的本周记录...</p>
                </div>
              )}

              {/* Report */}
              {report && (
                <div className="pt-4">
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap markdown-body">
                    {renderMarkdown(report)}
                  </div>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-mystic-purple/10">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-[10px] text-mystic-rose/55 hover:text-mystic-rose transition-colors disabled:opacity-30"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                      重新生成
                    </button>
                    <button
                      onClick={() => setExpanded(false)}
                      className="flex items-center gap-1 text-[10px] text-mystic-rose/45 hover:text-mystic-rose/65 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      收起
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="pt-5 text-center">
                  <p className="text-xs text-red-400/60 mb-3">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="text-[10px] text-mystic-rose/55 hover:text-mystic-rose transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple markdown renderer (mirrored from CardInterpretation)
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="text-mystic-gold font-cinzel text-sm mt-4 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-mystic-gold font-cinzel text-base mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-mystic-gold font-cinzel text-lg mt-5 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-foreground/85 text-sm">{line.slice(2)}</li>;
    if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 text-foreground/85 text-sm list-decimal">{line.replace(/^\d+\. /, "")}</li>;
    if (line.trim() === "") return <br key={i} />;
    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      return <p key={i} className="text-sm text-foreground/80 my-1">
        {parts.map((p, j) => p.startsWith("**") ? <strong key={j} className="text-mystic-gold">{p.slice(2, -2)}</strong> : p)}
      </p>;
    }
    return <p key={i} className="text-sm text-foreground/80 my-1">{line}</p>;
  });
}
