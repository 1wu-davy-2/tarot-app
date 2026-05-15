"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles } from "lucide-react";
import { PERIOD_LABELS, type Period } from "@/lib/fortune-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FortuneModalProps {
  open: boolean;
  zodiac: string;
  period: Period;
  selectedDate: string;
  onClose: () => void;
}

export function FortuneModal({ open, zodiac, period, selectedDate, onClose }: FortuneModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFortune = useCallback(async () => {
    if (!zodiac || loading) return;
    setLoading(true);
    setError("");
    setText("");
    setDone(false);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let accumulated = "";
    try {
      const params = new URLSearchParams({ zodiac, period, date: selectedDate });
      const url = API_BASE
        ? `${API_BASE}/api/fortune/cached?${params}`
        : `/api/fortune/cached?${params}`;
      const res = await fetch(url, {
        method: "POST",
        signal: abortRef.current.signal,
      });

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
  }, [zodiac, period, selectedDate, loading]);

  useEffect(() => {
    if (open) fetchFortune();
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  // Parse the AI response (JSON or plain text)
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { parsed = null; }

  const periodLabel = PERIOD_LABELS[period] || "今日";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
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
            {/* Header — compact */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-mystic-gold" />
                <h2 className="text-xs font-cinzel text-mystic-gold">
                  {periodLabel}运势 · AI 解读
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-mystic-purple/20 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(80dvh - 110px)" }}>
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Loader2 className="w-7 h-7 text-mystic-gold animate-spin" />
                  <p className="text-[11px] text-text-tertiary">正在解读星象...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-6">
                  <p className="text-sm text-red-400/80">{error}</p>
                  <button
                    onClick={fetchFortune}
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
                      {/* Summary + mood header */}
                      <div className="text-center pb-3 border-b border-white/8">
                        <p className="text-base text-mystic-gold font-cinzel">{parsed.summary}</p>
                        {parsed.mood && (
                          <p className="text-[10px] text-text-tertiary mt-0.5">{parsed.mood}</p>
                        )}
                      </div>

                      {/* Interpretation */}
                      <p className="text-xs text-text-primary leading-relaxed">
                        {parsed.interpretation}
                      </p>

                      {/* Advice + Warning */}
                      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/8">
                        <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-400/15">
                          <p className="text-[10px] text-green-400/60 mb-0.5">行动建议</p>
                          <p className="text-[11px] text-text-primary">{parsed.advice}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-400/15">
                          <p className="text-[10px] text-red-400/60 mb-0.5">避坑提醒</p>
                          <p className="text-[11px] text-text-primary">{parsed.warning}</p>
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

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-mystic-purple/20 shrink-0 text-center">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/20 transition-colors text-xs"
              >
                {done ? "关闭" : "跳过"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
