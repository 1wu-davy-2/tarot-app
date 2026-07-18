"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { isLoggedIn, getToken } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const C = {
  bg: "#0A0A0A",
  primary: "#f2ca50",
  secondary: "#e9c176",
  onSurface: "#e5e2e1",
  onSurfaceVariant: "#d0c5af",
  glassBase: "rgba(18,18,18,0.72)",
  glassBorder: "rgba(197,160,89,0.15)",
  outlineVariant: "rgba(77,70,53,0.3)",
  halo: "0 0 40px rgba(212,175,55,0.05)",
};
const FONT_SERIF = "'Noto Serif SC', serif";
const FONT_SANS  = "'Plus Jakarta Sans', sans-serif";
const NOISE_SVG  = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`;

interface AnswerRecord {
  id: number;
  question: string;
  answer: string;
  page_number: number;
  ai_interpretation: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${mo}.${day} · ${h}:${m}`;
}

export default function AnswerBookHistoryPage() {
  const [records, setRecords]   = useState<AnswerRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    fetch(`${API_BASE}/api/answer-book/history?limit=50`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: C.bg, fontFamily: FONT_SERIF }}>
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ backgroundImage: NOISE_SVG, opacity: 0.02 }} />
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
        <div className="w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16"
        style={{ background: "rgba(10,10,10,0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.outlineVariant}` }}
      >
        <Link href="/answer-book" className="w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70" style={{ color: C.primary }}>
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
        <h1 className="tracking-[0.2em] text-base" style={{ color: C.primary, fontFamily: FONT_SERIF, fontWeight: 500 }}>
          答案之书
        </h1>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="relative z-10 pt-20 pb-28 px-6 max-w-[720px] mx-auto">
        {/* Page title */}
        <header className="mb-10 text-center pt-4">
          <h2 className="tracking-widest mb-2" style={{ color: C.primary, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 26, lineHeight: "36px", letterSpacing: "0.05em" }}>
            往昔之念
          </h2>
          <p style={{ color: C.onSurfaceVariant, fontFamily: FONT_SERIF, fontSize: 14, opacity: 0.8 }}>
            静默的回响，封存的答案。
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <p className="text-center py-16 text-sm" style={{ color: C.onSurfaceVariant, fontFamily: FONT_SANS }}>
            加载中…
          </p>
        )}

        {/* Not logged in */}
        {!loading && !isLoggedIn() && (
          <p className="text-center py-16 text-sm" style={{ color: C.onSurfaceVariant, fontFamily: FONT_SANS }}>
            请先{" "}
            <Link href="/login" className="underline underline-offset-2" style={{ color: C.primary }}>
              登录
            </Link>{" "}
            查看翻阅记录
          </p>
        )}

        {/* Empty state */}
        {!loading && isLoggedIn() && records.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: C.onSurfaceVariant, fontFamily: FONT_SANS }}>
            还没有翻阅记录，去{" "}
            <Link href="/answer-book" className="underline underline-offset-2" style={{ color: C.primary }}>
              翻开答案之书
            </Link>{" "}
            吧
          </p>
        )}

        {/* Record list */}
        <div className="space-y-6">
          {records.map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-6 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: C.glassBase,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${C.glassBorder}`,
                boxShadow: C.halo,
              }}
            >
              {/* Meta row */}
              <div className="flex justify-between items-start mb-4">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{
                    fontSize: 11,
                    color: "#99907c",
                    background: "rgba(32,31,31,0.5)",
                    border: "1px solid rgba(153,144,124,0.2)",
                    fontFamily: FONT_SANS,
                    letterSpacing: "0.05em",
                  }}
                >
                  第 {r.page_number} 页
                </span>
                <time style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: FONT_SANS, opacity: 0.6 }}>
                  {formatDate(r.created_at)}
                </time>
              </div>

              {/* Question */}
              {r.question && (
                <h3 className="leading-relaxed mb-5" style={{ color: C.onSurface, fontFamily: FONT_SERIF, fontSize: 15 }}>
                  「{r.question}」
                </h3>
              )}

              {/* Answer */}
              <div className="pt-4" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="tracking-wide leading-relaxed" style={{ color: C.secondary, fontFamily: FONT_SERIF, fontSize: 16 }}>
                    「{r.answer}」
                  </p>
                  {r.ai_interpretation && (
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="shrink-0 mt-0.5 transition-opacity hover:opacity-80"
                      style={{ color: C.onSurfaceVariant }}
                    >
                      {expanded === r.id
                        ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                        : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  )}
                </div>

                {/* AI interpretation */}
                {expanded === r.id && r.ai_interpretation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4"
                    style={{ borderTop: `1px solid ${C.outlineVariant}` }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.onSurfaceVariant, fontFamily: FONT_SERIF }}>
                      {r.ai_interpretation}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        {/* End of list */}
        {!loading && records.length > 0 && (
          <div className="text-center mt-10 pb-4">
            <p style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: FONT_SANS, opacity: 0.4, letterSpacing: "0.08em" }}>
              已触达记忆的尽头
            </p>
            <div className="w-12 h-px mx-auto mt-4" style={{ background: "rgba(77,70,53,0.5)" }} />
          </div>
        )}
      </main>
    </div>
  );
}
