"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TarotCard } from "./TarotCard";
import { AIInterpretation } from "./AIInterpretation";
import type { TarotCard as TarotCardType } from "@/lib/tarot-data";
import { Sparkles } from "lucide-react";

interface DailyReadingProps {
  card: TarotCardType;
  isReversed: boolean;
  date: string;
}

export function DailyReading({ card, isReversed, date }: DailyReadingProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
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

      {/* Card area */}
      <div className="flex flex-col items-center gap-6">
        <TarotCard
          card={card}
          isReversed={isReversed}
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
                <h2 className="text-xl font-cinzel text-mystic-gold">{card.nameCN}</h2>
                <p className="text-mystic-rose/60 text-sm mt-1">
                  {isReversed ? "逆位 · Reversed" : "正位 · Upright"}
                </p>
              </div>
              <p className="text-foreground/70 text-sm text-center max-w-sm italic leading-relaxed">
                {isReversed ? card.reversedMeaning : card.uprightMeaning}
              </p>
              <button
                onClick={() => setShowInterpretation(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/10 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">获取 AI 深度解读</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Interpretation */}
      {showInterpretation && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-lg"
        >
          <AIInterpretation
            cards={[card]}
            isReversed={[isReversed]}
            spreadType="每日单牌"
            question="今日的指引与能量"
          />
        </motion.div>
      )}
    </div>
  );
}
