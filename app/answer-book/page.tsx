"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles, RefreshCw, History, Share2 } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { isLoggedIn, getToken } from "@/lib/api-client";
import { pickRandomPage, getAnswerByPage, TOTAL_PAGES } from "@/lib/answer-book-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Obsidian & Gilt design tokens ──────────────────────────────────
const C = {
  bg: "#0A0A0A",
  primary: "#f2ca50",
  primaryDim: "#D4AF37",
  secondary: "#e9c176",
  onSurface: "#e5e2e1",
  onSurfaceVariant: "#d0c5af",
  glassBase: "rgba(18,18,18,0.72)",
  glassBorder: "rgba(197,160,89,0.15)",
  cornerAccent: "rgba(242,202,80,0.3)",
  outlineVariant: "rgba(77,70,53,0.3)",
  halo: "0 0 40px rgba(212,175,55,0.06)",
};
const FONT_SERIF = "'Noto Serif SC', serif";
const FONT_SANS  = "'Plus Jakarta Sans', sans-serif";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`;

const CHIP_LABELS = ["感情", "事业", "解惑"];

export default function AnswerBookPage() {
  const [question, setQuestion]     = useState("");
  const [answer, setAnswer]         = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number | null>(null);
  const [recordId, setRecordId]     = useState<number | null>(null);
  const [flipping, setFlipping]     = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [aiText, setAiText]         = useState("");
  const [showLogin, setShowLogin]   = useState(false);
  const [interpreted, setInterpreted] = useState(false);
  const streamRef = useRef<AbortController | null>(null);

  const handleFlip = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    setAiText("");
    setInterpreted(false);
    setRecordId(null);

    setTimeout(async () => {
      const newPage = pickRandomPage(pageNumber ?? undefined);
      const newAnswer = getAnswerByPage(newPage);
      setPageNumber(newPage);
      setAnswer(newAnswer);
      setFlipping(false);

      if (isLoggedIn()) {
        try {
          const resp = await fetch(`${API_BASE}/api/answer-book/record`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ question: question.trim(), answer: newAnswer, page_number: newPage }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setRecordId(data.id);
          }
        } catch {}
      }
    }, 900);
  }, [flipping, pageNumber, question]);

  const handleInterpret = useCallback(async () => {
    if (!answer || interpreting) return;
    if (!isLoggedIn()) { setShowLogin(true); return; }

    setInterpreting(true);
    setAiText("");
    setInterpreted(true);

    const token = getToken();
    const controller = new AbortController();
    streamRef.current = controller;
    let accumulated = "";

    try {
      const resp = await fetch(`${API_BASE}/api/answer-book/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: question.trim(), answer }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        setAiText(d.error || d.detail || "请求失败");
        setInterpreting(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { setAiText("无法读取响应"); setInterpreting(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t || !t.startsWith("data: ")) continue;
          const data = t.slice(6);
          if (data === "[DONE]") {
            if (recordId && accumulated) {
              fetch(`${API_BASE}/api/answer-book/record/${recordId}/interpretation`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ interpretation: accumulated }),
              }).catch(() => {});
            }
            setInterpreting(false);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) { setAiText(parsed.error); setInterpreting(false); return; }
            if (parsed.content) { accumulated += parsed.content; setAiText(p => p + parsed.content); }
          } catch {}
        }
      }
      setInterpreting(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") setAiText(err.message || "网络错误");
      setInterpreting(false);
    }
  }, [answer, interpreting, question, recordId]);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: C.bg, fontFamily: FONT_SERIF }}>
      {/* Noise texture */}
      <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ backgroundImage: NOISE_SVG, opacity: 0.02 }} />
      {/* Ambient gold glow */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-30">
        <div className="w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* ── Main Canvas ── */}
      <main className="relative z-10 flex flex-col items-center pt-6 pb-36 px-6 min-h-screen max-w-[720px] mx-auto">

        {/* Inline nav row */}
        <div className="w-full flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-opacity hover:opacity-70 active:scale-95"
            style={{ color: C.onSurfaceVariant, fontFamily: FONT_SANS, fontSize: 13, letterSpacing: "0.04em" }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span>首页</span>
          </Link>
          <h1 className="tracking-[0.2em] text-base" style={{ color: C.primary, fontFamily: FONT_SERIF, fontWeight: 500 }}>
            答案之书
          </h1>
          <Link
            href="/answer-book/history"
            className="w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ color: C.onSurfaceVariant }}
          >
            <History className="w-5 h-5" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Input */}
        <div className="w-full max-w-sm mb-12">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="在心中默念你的问题…"
            maxLength={200}
            className="w-full bg-transparent text-center py-4 outline-none text-base transition-all"
            style={{
              borderBottom: "1px solid #C5A059",
              color: C.onSurface,
              fontFamily: FONT_SERIF,
              caretColor: C.primary,
            }}
          />
          <div className="flex justify-center gap-2 mt-4">
            {CHIP_LABELS.map(chip => (
              <span
                key={chip}
                className="px-3 py-1 rounded-full text-xs select-none"
                style={{
                  background: "rgba(96,68,3,0.2)",
                  color: C.secondary,
                  border: "1px solid rgba(233,193,118,0.2)",
                  fontFamily: FONT_SANS,
                  letterSpacing: "0.05em",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* ── Book Card ── */}
        <motion.div
          className="w-full max-w-[260px] aspect-[3/4] rounded-xl relative cursor-pointer overflow-hidden mb-10 group"
          onClick={!flipping ? handleFlip : undefined}
          whileTap={{ scale: 0.97 }}
          style={{ background: C.glassBase, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${C.glassBorder}`, boxShadow: C.halo }}
        >
          {/* Corner accents */}
          {[["top-4 left-4","border-t border-l"],["top-4 right-4","border-t border-r"],["bottom-4 left-4","border-b border-l"],["bottom-4 right-4","border-b border-r"]].map(([pos, cls]) => (
            <div key={pos} className={`absolute w-6 h-6 ${pos} ${cls}`} style={{ borderColor: C.cornerAccent }} />
          ))}
          {/* Book spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: `linear-gradient(to bottom, transparent, ${C.outlineVariant}, transparent)` }} />
          {/* Hover shimmer border */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ border: "1px solid rgba(212,175,55,0.25)", boxShadow: "inset 0 0 20px rgba(212,175,55,0.06)" }} />

          <AnimatePresence mode="wait">
            {!answer && !flipping ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center">
                <BookOpen className="w-14 h-14 mb-5" strokeWidth={1} style={{ color: "rgba(242,202,80,0.4)" }} />
                <p className="text-base tracking-[0.25em] text-center leading-loose" style={{ color: "rgba(242,202,80,0.55)", fontFamily: FONT_SERIF }}>
                  闭上双眼<br />静待启示
                </p>
              </motion.div>
            ) : flipping ? (
              <motion.div key="flipping" className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles className="w-10 h-10" style={{ color: "rgba(242,202,80,0.5)" }} />
              </motion.div>
            ) : (
              <motion.div key={answer} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-xl leading-relaxed tracking-widest" style={{ color: C.primary, fontFamily: FONT_SERIF, fontWeight: 600 }}>
                  {answer}
                </p>
                {pageNumber && (
                  <>
                    <div className="w-10 h-px my-4" style={{ background: "rgba(242,202,80,0.35)" }} />
                    <p className="uppercase tracking-[0.18em]" style={{ fontSize: 10, color: "rgba(208,197,175,0.55)", fontFamily: FONT_SANS }}>
                      Chapter {pageNumber} · The Revelation
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Primary Button ── */}
        <motion.button
          onClick={handleFlip}
          disabled={flipping}
          whileTap={{ scale: 0.96 }}
          className="mb-8 px-10 py-4 rounded-full flex items-center gap-3 tracking-widest text-sm transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(180deg,#1A1A1A 0%,#0F0F0F 100%)",
            border: "1px solid rgba(212,175,55,0.4)",
            color: C.primary,
            fontFamily: FONT_SERIF,
            fontWeight: 500,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 18px rgba(0,0,0,0.5)",
          }}
        >
          <RefreshCw className={`w-4 h-4 ${flipping ? "animate-spin" : ""}`} strokeWidth={1.5} />
          {answer ? "再翻一次" : "翻开答案之书"}
        </motion.button>

        {/* ── Circular Action Buttons (after answer) ── */}
        <AnimatePresence>
          {answer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-8 mb-8">
              {/* Ask again */}
              <CircleAction icon={<RefreshCw className="w-5 h-5" strokeWidth={1.5} />} label="再问一次" onClick={handleFlip} />
              {/* AI interpret */}
              {!interpreted && (
                <CircleAction
                  icon={<Sparkles className="w-5 h-5" strokeWidth={1.5} />}
                  label="AI 解读"
                  onClick={handleInterpret}
                  loading={interpreting}
                />
              )}
              {/* Share */}
              <CircleAction icon={<Share2 className="w-5 h-5" strokeWidth={1.5} />} label="分享" onClick={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Interpretation Panel ── */}
        <AnimatePresence>
          {(aiText || interpreting) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full max-w-md rounded-xl p-5"
              style={{ background: C.glassBase, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${C.glassBorder}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" strokeWidth={1.5} style={{ color: C.primary }} />
                <span className="text-sm tracking-widest" style={{ color: C.primary, fontFamily: FONT_SANS }}>AI 解读</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.onSurfaceVariant, fontFamily: FONT_SERIF }}>
                {aiText}
                {interpreting && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom animate-pulse" style={{ background: C.primary }} />
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
}

// ── Circular icon button helper ────────────────────────────────────
function CircleAction({ icon, label, onClick, loading }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      className="flex flex-col items-center gap-2 group transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      onClick={onClick}
      disabled={loading}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:border-opacity-70"
        style={{
          border: "1px solid rgba(242,202,80,0.3)",
          background: "rgba(10,10,10,0.55)",
          backdropFilter: "blur(8px)",
          color: "#f2ca50",
          boxShadow: "0 0 20px rgba(212,175,55,0.05)",
        }}
      >
        {loading ? <RefreshCw className="w-5 h-5 animate-spin" strokeWidth={1.5} /> : icon}
      </div>
      <span style={{ fontSize: 11, color: "#d0c5af", fontFamily: FONT_SANS, letterSpacing: "0.08em" }}>{label}</span>
    </button>
  );
}
