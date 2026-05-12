"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { TarotCard } from "@/components/TarotCard";
import { CardInterpretation } from "@/components/CardInterpretation";
import { ShareButton } from "@/components/ShareButton";
import type { TarotCard as TarotCardType } from "@/lib/tarot-data";
import { tarotCards } from "@/lib/tarot-data";
import { saveReading, updateReading } from "@/lib/reading-history";
import { isLoggedIn, apiSaveReading } from "@/lib/api-client";

interface DailyData {
  card: TarotCardType;
  isReversed: boolean;
  date: string;
}

interface DailyApiResponse {
  card?: TarotCardType;
  card_index?: number;
  isReversed: boolean;
  date: string;
}

export default function DailyPage() {
  const [data, setData] = useState<DailyData | null>(null);
  const [error, setError] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [aiText, setAiText] = useState("");

  useEffect(() => {
    fetch("/api/daily-reading")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<DailyApiResponse>;
      })
      .then((json) => {
        if (json.card) {
          setData({ card: json.card, isReversed: json.isReversed, date: json.date });
        } else if (json.card_index !== undefined) {
          setData({
            card: tarotCards[json.card_index] ?? tarotCards[0],
            isReversed: json.isReversed,
            date: json.date,
          });
        }
      })
      .catch((err) => setError(err.message || "获取今日牌失败"));
  }, []);

  // Save reading to history once interpretation is shown
  const dailySaved = useRef(false);
  const dailyId = useRef("");
  useEffect(() => {
    if (showInterpretation && data && !dailySaved.current) {
      dailySaved.current = true;
      dailyId.current = String(Date.now());
      const i = data.isReversed ? data.card.interpretation.reversed : data.card.interpretation.upright;
      saveReading({
        id: dailyId.current,
        date: new Date().toISOString(),
        spreadType: "每日单牌",
        question: "今日的指引与能量",
        cards: [{
          nameCN: data.card.nameCN,
          imageUrl: data.card.imageUrl,
          isReversed: data.isReversed,
          position: "今日指引",
        }],
        standardInterpretation: [
          "🌟 综合解读：" + i.general,
          "💕 感情运势：" + i.love,
          "💼 事业学业：" + i.career,
          "💰 财运分析：" + i.finance,
          "💡 行动建议：" + i.advice,
        ].join("\n\n"),
      });
      // Also save to backend if logged in
      if (isLoggedIn()) {
        apiSaveReading({
          question: "今日的指引与能量",
          ai_response: "",
          spread_type: "每日单牌",
          cards: [{
            nameCN: data.card.nameCN,
            imageUrl: data.card.imageUrl,
            isReversed: data.isReversed,
            position: "今日指引",
          }],
        }).catch(() => {});
      }
    }
  }, [showInterpretation, data]);

  // Update AI interpretation when it arrives
  useEffect(() => {
    if (aiText && dailySaved.current && dailyId.current) {
      updateReading(dailyId.current, { aiInterpretation: aiText });
      // Update backend with AI response
      if (isLoggedIn() && data) {
        apiSaveReading({
          question: "今日的指引与能量",
          ai_response: aiText,
          spread_type: "每日单牌",
          cards: [{
            nameCN: data.card.nameCN,
            imageUrl: data.card.imageUrl,
            isReversed: data.isReversed,
            position: "今日指引",
          }],
        }).catch(() => {});
      }
    }
  }, [aiText]);

  const formattedDate = data
    ? new Date(data.date).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : "";

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

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-mystic-gold underline text-sm">
              重试
            </button>
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center gap-4 py-40">
            <Loader2 className="w-10 h-10 text-mystic-gold animate-spin" />
            <p className="text-mystic-rose/50 text-sm">正在排列今日的宇宙能量...</p>
          </div>
        )}

        {data && (
          <div className="flex flex-col items-center gap-8">
            {/* Date header */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-mystic-gold/60 text-sm tracking-widest uppercase font-cinzel">Daily Tarot</p>
              <h1 className="text-3xl md:text-4xl font-cinzel text-mystic-gold mt-2 text-glow">今日塔罗</h1>
              <p className="text-mystic-rose/50 text-sm mt-2">{formattedDate}</p>
            </motion.div>

            {/* Card */}
            <div className="flex flex-col items-center gap-6">
              <TarotCard
                card={data.card}
                isReversed={data.isReversed}
                isFlipped={isFlipped}
                onClick={() => !isFlipped && setIsFlipped(true)}
                size="lg"
              />

              <AnimatePresence mode="wait">
                {!isFlipped && (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-mystic-rose/40 text-sm animate-pulse"
                  >
                    轻触牌面揭示今日指引
                  </motion.p>
                )}

                {isFlipped && !showInterpretation && (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="text-center">
                      <h2 className="text-xl font-cinzel text-mystic-gold">{data.card.nameCN}</h2>
                      <p className="text-mystic-rose/60 text-sm mt-1">
                        {data.isReversed ? "逆位 · Reversed" : "正位 · Upright"}
                      </p>
                    </div>
                    <p className="text-foreground/70 text-sm text-center max-w-sm italic leading-relaxed">
                      {data.isReversed ? data.card.reversedMeaning : data.card.uprightMeaning}
                    </p>
                    <button
                      onClick={() => setShowInterpretation(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/10 transition-all duration-300"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">获取深度解读</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Interpretation tabs */}
            {showInterpretation && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-lg flex flex-col items-center gap-4"
              >
                <CardInterpretation
                  card={data.card}
                  isReversed={data.isReversed}
                  question="今日的指引与能量"
                  spreadType="每日单牌"
                  onAiText={setAiText}
                />
                <ShareButton
                  cards={[data.card]}
                  isReversed={[data.isReversed]}
                  spreadType="每日单牌"
                  question="今日的指引与能量"
                  interpretation={aiText}
                  standardInterpretation={(() => {
                    const i = data.isReversed ? data.card.interpretation.reversed : data.card.interpretation.upright;
                    return [
                      "🌟 综合解读：" + i.general,
                      "💕 感情运势：" + i.love,
                      "💼 事业学业：" + i.career,
                      "💰 财运分析：" + i.finance,
                      "💡 行动建议：" + i.advice,
                    ].join("\n\n");
                  })()}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
