"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { isLoggedIn, getToken } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface AnswerRecord {
  id: number;
  question: string;
  answer: string;
  page_number: number;
  ai_interpretation: string | null;
  created_at: string;
}

export default function AnswerBookHistoryPage() {
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/answer-book/history?limit=50`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-mystic-dark px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/answer-book" className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-cinzel text-mystic-gold tracking-wider">翻阅记录</h1>
      </div>

      {loading && (
        <p className="text-text-secondary text-sm text-center py-12">加载中…</p>
      )}

      {!loading && !isLoggedIn() && (
        <p className="text-text-secondary text-sm text-center py-12">
          请先
          <Link href="/login" className="text-mystic-gold mx-1 underline underline-offset-2">登录</Link>
          查看翻阅记录
        </p>
      )}

      {!loading && isLoggedIn() && records.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-12">
          还没有翻阅记录，去
          <Link href="/answer-book" className="text-mystic-gold mx-1 underline underline-offset-2">翻开答案之书</Link>
          吧
        </p>
      )}

      <div className="flex flex-col gap-3">
        {records.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {r.question && (
                  <p className="text-text-secondary text-xs mb-1.5 truncate">问：{r.question}</p>
                )}
                <p className="text-amber-200 font-cinzel tracking-wider text-base">「{r.answer}」</p>
                <p className="text-amber-600/50 text-xs mt-1.5 font-mono">
                  第 {r.page_number} 页 · {new Date(r.created_at).toLocaleDateString("zh-CN", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              {r.ai_interpretation && (
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="text-text-tertiary hover:text-text-secondary shrink-0 mt-1 transition-colors"
                >
                  {expanded === r.id
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>

            {expanded === r.id && r.ai_interpretation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-white/10"
              >
                <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
                  {r.ai_interpretation}
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
