"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, Plus, ChevronDown, Brain } from "lucide-react";
import { tarotCards, type TarotCard } from "@/lib/tarot-data";
import {
  getLearnedCards, markCardLearned, addToLearningList,
  getLearnedCountBySuit, SUIT_LABELS, SUIT_TOTALS,
} from "@/lib/quiz-generator";

// Deterministic daily learning card (different seed from daily reading)
function getDailyLearningCard(): TarotCard {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  let hash = 9973; // Different seed from daily-seed.ts
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) ^ dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % tarotCards.length;
  return tarotCards[index];
}

const dimensionLabels: Record<string, { label: string; icon: string }> = {
  general: { label: "综合解读", icon: "🌟" },
  love: { label: "感情运势", icon: "💕" },
  career: { label: "事业学业", icon: "💼" },
  finance: { label: "财运分析", icon: "💰" },
  advice: { label: "行动建议", icon: "💡" },
};

export function DailyLearning() {
  const [card, setCard] = useState<TarotCard | null>(null);
  const [learned, setLearned] = useState(false);
  const [inList, setInList] = useState(false);
  const [expandedDim, setExpandedDim] = useState<string>("general");
  const [orientation, setOrientation] = useState<"upright" | "reversed">("upright");
  const [stats, setStats] = useState<ReturnType<typeof getLearnedCountBySuit>>({ major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 });

  useEffect(() => {
    const c = getDailyLearningCard();
    setCard(c);
    const learnedSet = getLearnedCards();
    setLearned(learnedSet.has(c.id));
    try {
      const list = JSON.parse(localStorage.getItem("tarot_learning_list") || "[]") as number[];
      setInList(list.includes(c.id));
    } catch {}
    setStats(getLearnedCountBySuit());
  }, []);

  const handleLearned = () => {
    if (!card) return;
    markCardLearned(card.id);
    setLearned(true);
    setInList(false);
    setStats(getLearnedCountBySuit());
  };

  const handleAddToList = () => {
    if (!card) return;
    addToLearningList(card.id);
    setInList(true);
  };

  if (!card) return null;

  const interp = orientation === "upright" ? card.interpretation.upright : card.interpretation.reversed;
  const dimKeys = Object.keys(interp) as (keyof typeof interp)[];
  const totalLearned = Object.values(stats).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Learning progress header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-mystic-gold" />
          <span className="text-xs font-cinzel text-mystic-gold">学习进度</span>
          <span className="text-[10px] text-text-tertiary ml-auto">{totalLearned}/78</span>
        </div>
        <div className="h-1.5 rounded-full bg-mystic-purple/15 overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((totalLearned / 78) * 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(stats).map(([key, count]) => (
            <div key={key} className="text-center">
              <span className="text-[10px] text-text-tertiary">{SUIT_LABELS[key]?.slice(0, 2)}</span>
              <p className="text-[10px] text-text-secondary">{count}/{SUIT_TOTALS[key]}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Card display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col items-center gap-4 mb-5">
          <div className="w-36 h-56 rounded-xl overflow-hidden border-2 border-mystic-gold/30 shadow-lg">
            <img src={card.imageUrl} alt={card.nameCN} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-cinzel text-mystic-gold">{card.nameCN}</h2>
            <p className="text-xs text-text-secondary">{card.name}</p>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-text-secondary">
              {card.arcana === "major" ? "大阿卡纳" : "小阿卡纳"}
            </span>
            {card.suit && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-text-secondary">
                {card.suit === "wands" ? "权杖" : card.suit === "cups" ? "圣杯" : card.suit === "swords" ? "宝剑" : "星币"}
              </span>
            )}
            {card.element && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-text-secondary">
                {card.element}元素
              </span>
            )}
            {card.planet && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-text-secondary">
                {card.planet}
              </span>
            )}
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {card.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-mystic-gold/10 text-mystic-gold/70 text-[11px]">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Orientation tabs */}
        <div className="flex border-b border-mystic-purple/20 mb-4">
          <button
            onClick={() => setOrientation("upright")}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-[1px] ${
              orientation === "upright" ? "border-mystic-gold text-mystic-gold" : "border-transparent text-text-secondary"
            }`}
          >正位 Upright</button>
          <button
            onClick={() => setOrientation("reversed")}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-[1px] ${
              orientation === "reversed" ? "border-mystic-gold text-mystic-gold" : "border-transparent text-text-secondary"
            }`}
          >逆位 Reversed</button>
        </div>

        {/* Meaning */}
        <p className="text-xs text-text-secondary italic text-center mb-4">
          {orientation === "upright" ? card.uprightMeaning : card.reversedMeaning}
        </p>

        {/* Dimensions accordion */}
        <div className="space-y-2">
          {dimKeys.map((key) => {
            const dim = dimensionLabels[key];
            if (!dim) return null;
            const isOpen = expandedDim === key;
            return (
              <div key={key} className="border border-mystic-purple/15 rounded-md overflow-hidden">
                <button
                  onClick={() => setExpandedDim(isOpen ? "" : key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-mystic-purple/10 transition-colors"
                >
                  <span className="text-xs font-cinzel text-mystic-gold/80 flex items-center gap-1.5">
                    <span>{dim.icon}</span> {dim.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 text-xs text-text-primary leading-relaxed border-t border-mystic-purple/10 pt-2">
                        {interp[key]}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Symbolism */}
        {card.symbolism && (
          <div className="mt-4 pt-4 border-t border-mystic-purple/20">
            <p className="text-[10px] text-text-secondary mb-1">牌面象征</p>
            <p className="text-[10px] text-text-tertiary italic">{card.symbolism}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {!learned ? (
            <button
              onClick={handleLearned}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 transition-all text-sm"
            >
              <Check className="w-4 h-4" />
              我已掌握
            </button>
          ) : (
            <span className="text-xs text-mystic-gold/60 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 已掌握
            </span>
          )}
          {!learned && !inList && (
            <button
              onClick={handleAddToList}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-purple/30 text-text-secondary hover:bg-mystic-purple/10 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              加入学习列表
            </button>
          )}
          {inList && (
            <span className="text-xs text-text-secondary">已在学习列表中</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
