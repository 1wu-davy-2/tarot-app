"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, Send, Sparkles, RefreshCw, History } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { isLoggedIn, getToken } from "@/lib/api-client";
import { pickRandomPage, getAnswerByPage, TOTAL_PAGES } from "@/lib/answer-book-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function AnswerBookPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [aiText, setAiText] = useState("");
  const [showLogin, setShowLogin] = useState(false);
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
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              question: question.trim(),
              answer: newAnswer,
              page_number: newPage,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setRecordId(data.id);
          }
        } catch {}
      }
    }, 800);
  }, [flipping, pageNumber, question]);

  const handleInterpret = useCallback(async () => {
    if (!answer || interpreting) return;
    if (!isLoggedIn()) {
      setShowLogin(true);
      return;
    }

    setInterpreting(true);
    setAiText("");
    setInterpreted(true);

    const token = getToken();
    const controller = new AbortController();
    streamRef.current = controller;

    // Accumulate full text for saving to record
    let accumulatedText = "";

    try {
      const resp = await fetch(`${API_BASE}/api/answer-book/interpret`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: question.trim(), answer }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setAiText(data.error || data.detail || "请求失败");
        setInterpreting(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        setAiText("无法读取响应");
        setInterpreting(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            // Save interpretation to record
            if (recordId && accumulatedText) {
              fetch(`${API_BASE}/api/answer-book/record/${recordId}/interpretation`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ interpretation: accumulatedText }),
              }).catch(() => {});
            }
            setInterpreting(false);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setAiText(parsed.error);
              setInterpreting(false);
              return;
            }
            if (parsed.content) {
              accumulatedText += parsed.content;
              setAiText((prev) => prev + parsed.content);
            }
          } catch {}
        }
      }
      setInterpreting(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setAiText(err.message || "网络错误");
      }
      setInterpreting(false);
    }
  }, [answer, interpreting, question, recordId]);

  return (
    <div className="min-h-screen bg-mystic-dark flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center gap-3 mb-8">
        <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-cinzel text-mystic-gold tracking-wider">答案之书</h1>
        <Link href="/answer-book/history" className="ml-auto text-text-secondary hover:text-text-primary transition-colors">
          <History className="w-5 h-5" />
        </Link>
      </div>

      {/* Question input */}
      <div className="w-full max-w-md mb-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <label className="text-text-secondary text-xs mb-2 block">
            默想你的问题，或在此写下（可选）
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="比如：我该换工作吗？"
            maxLength={200}
            className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted/40"
          />
          {question.length > 0 && (
            <div className="text-right text-text-muted/50 text-xs mt-1">
              {question.length}/200
            </div>
          )}
        </div>
      </div>

      {/* Book area */}
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Book visual */}
        <motion.div
          className="relative w-64 h-80 mb-8 cursor-pointer select-none"
          onClick={handleFlip}
          whileTap={{ scale: 0.97 }}
        >
          {/* Book cover / pages effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-amber-800/60 to-amber-950/80 rounded-r-lg rounded-l-sm border border-amber-700/40 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Spine line */}
            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-amber-700/30" />
            {/* Decorative border */}
            <div className="absolute inset-3 border border-amber-600/20 rounded-r-md" />

            <AnimatePresence mode="wait">
              {!answer && !flipping ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center z-10 px-6"
                >
                  <BookOpen className="w-12 h-12 text-amber-400/60 mx-auto mb-4" />
                  <p className="text-amber-300/80 text-sm">轻触书页</p>
                  <p className="text-amber-400/40 text-xs mt-1">翻开你的答案</p>
                </motion.div>
              ) : flipping ? (
                <motion.div
                  key="flipping"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.2, 0.8] }}
                  transition={{ duration: 0.6 }}
                  className="text-center z-10"
                >
                  <Sparkles className="w-8 h-8 text-amber-300/60 mx-auto animate-pulse" />
                </motion.div>
              ) : (
                <motion.div
                  key={answer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="text-center z-10 px-6"
                >
                  <p className="text-2xl font-cinzel text-amber-200 tracking-widest leading-relaxed">
                    {answer}
                  </p>
                  {pageNumber && (
                    <p className="text-amber-600/50 text-xs mt-3 font-mono">
                      第 {pageNumber} 页 · 共 {TOTAL_PAGES} 页
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Page edge stack (visual depth) */}
          <div className="absolute -right-1 top-1 bottom-1 w-2 bg-amber-900/40 rounded-r-sm -z-10" />
          <div className="absolute -right-2 top-2 bottom-2 w-1 bg-amber-950/30 rounded-r-sm -z-20" />
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <button
            onClick={handleFlip}
            disabled={flipping}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${flipping ? "animate-spin" : ""}`} />
            {answer ? "再次翻页" : "翻开答案之书"}
          </button>

          {answer && !interpreted && (
            <button
              onClick={handleInterpret}
              disabled={interpreting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-mystic-purple/20 border border-mystic-purple/30 text-purple-300 hover:bg-mystic-purple/30 transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              AI 解读这个答案
            </button>
          )}
        </div>

        {/* AI interpretation */}
        {(aiText || interpreting) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-mystic-gold" />
              <span className="text-mystic-gold text-sm font-medium">AI 解读</span>
            </div>
            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {aiText}
              {interpreting && (
                <span className="inline-block w-2 h-4 bg-mystic-gold ml-0.5 animate-pulse align-text-bottom" />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Login modal */}
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        message="登录后可使用 AI 解读答案"
      />
    </div>
  );
}
