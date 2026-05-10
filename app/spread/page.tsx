"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shuffle, Sparkles, Clock, Layers } from "lucide-react";
import { TarotCard } from "@/components/TarotCard";
import { CardDrawAnimation } from "@/components/CardDrawAnimation";
import { CardInterpretation } from "@/components/CardInterpretation";
import { tarotCards, type TarotCard as TarotCardType } from "@/lib/tarot-data";

type SpreadType = "three-card" | "celtic-cross";

interface CardState {
  card: TarotCardType;
  isReversed: boolean;
  position: string;
  flipped: boolean;
}

const SPREADS = {
  "three-card": {
    name: "三牌阵",
    subtitle: "Three Card Spread",
    description: "简洁而深刻的入门牌阵，适合日常决策和快速指引",
    icon: "🜂🜄🜁",
    cardCount: 3,
    difficulty: "入门",
    time: "3分钟",
    bestFor: "日常决策、快速指引",
    positions: [
      { label: "过去", sublabel: "Past", desc: "近期已发生的事件对当下的影响" },
      { label: "现在", sublabel: "Present", desc: "当前的核心能量和状况" },
      { label: "未来", sublabel: "Future", desc: "按此趋势即将到来的发展方向" },
    ],
  },
  "celtic-cross": {
    name: "凯尔特十字",
    subtitle: "Celtic Cross",
    description: "全方位的深度牌阵，揭示复杂局面中的各个维度",
    icon: "✧",
    cardCount: 10,
    difficulty: "进阶",
    time: "15分钟",
    bestFor: "深度分析、复杂局面",
    positions: [
      { label: "当下", sublabel: "Present", desc: "当前局面的核心能量" },
      { label: "阻碍", sublabel: "Challenge", desc: "横跨在你面前的主要挑战" },
      { label: "过去", sublabel: "Past", desc: "影响此刻的过往根基" },
      { label: "未来", sublabel: "Future", desc: "即将到来的能量趋势" },
      { label: "意识之上", sublabel: "Above", desc: "你最好的期望或目标" },
      { label: "意识之下", sublabel: "Below", desc: "潜意识中的根本动机" },
      { label: "建议", sublabel: "Advice", desc: "如何应对当前局面" },
      { label: "外部环境", sublabel: "External", desc: "他人眼中的你/外部影响" },
      { label: "希望与恐惧", sublabel: "Hopes/Fears", desc: "你内心的期望与担忧" },
      { label: "结果", sublabel: "Outcome", desc: "如果照此路走下去的结局" },
    ],
  },
} as const;

export default function SpreadPage() {
  const [spreadType, setSpreadType] = useState<SpreadType | null>(null);
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<CardState[]>([]);
  const [phase, setPhase] = useState<"select-type" | "draw" | "revealing" | "interpreting">("select-type");
  const [flippedCount, setFlippedCount] = useState(0);
  const [showInterpretation, setShowInterpretation] = useState(false);

  const spread = spreadType ? SPREADS[spreadType] : null;

  const handleDrawComplete = useCallback(
    (selected: { card: TarotCardType; isReversed: boolean }[]) => {
      const positions = spreadType === "three-card"
        ? ["过去 (Past)", "现在 (Present)", "未来 (Future)"]
        : SPREADS["celtic-cross"].positions.map(p => `${p.label} (${p.sublabel})`);

      setCards(
        selected.map((s, i) => ({
          card: s.card,
          isReversed: s.isReversed,
          position: positions[i] || `位置${i + 1}`,
          flipped: false,
        }))
      );
      setPhase("revealing");
      setFlippedCount(0);
    },
    [spreadType]
  );

  const handleFlipCard = (index: number) => {
    if (cards[index].flipped) return;
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, flipped: true } : c)));
    const newCount = flippedCount + 1;
    setFlippedCount(newCount);
    if (newCount >= cards.length) {
      setPhase("interpreting");
    }
  };

  const handleFlipAll = () => {
    setCards((prev) => prev.map((c) => ({ ...c, flipped: true })));
    setFlippedCount(cards.length);
    setPhase("interpreting");
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-mystic-rose/50 hover:text-mystic-rose transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <AnimatePresence mode="wait">
          {/* ── Phase: Select spread type ── */}
          {phase === "select-type" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-10"
            >
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-cinzel text-mystic-gold text-glow">牌阵占卜</h1>
                <p className="text-mystic-rose/50 text-sm mt-2">选择牌阵，聆听命运的指引</p>
              </div>

              {/* Spread selection cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
                  const s = SPREADS[key];
                  return (
                    <motion.button
                      key={key}
                      onClick={() => setSpreadType(key)}
                      className={`glass-card p-6 text-left hover:border-mystic-gold/40 transition-all duration-300 group relative ${
                        spreadType === key ? "border-mystic-gold/60" : ""
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{s.icon}</div>
                      <h3 className="text-xl font-cinzel text-mystic-gold mb-1">{s.name}</h3>
                      <p className="text-foreground/40 text-xs mb-3">{s.subtitle}</p>
                      <p className="text-foreground/60 text-sm mb-3">{s.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-mystic-purple/30 text-mystic-rose/80">
                          <Clock className="w-3 h-3 inline mr-1" />{s.time}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-mystic-purple/30 text-mystic-rose/80">
                          <Layers className="w-3 h-3 inline mr-1" />{s.cardCount}张牌
                        </span>
                        <span className="px-2 py-1 rounded-full bg-mystic-purple/30 text-mystic-rose/80">
                          {s.difficulty}
                        </span>
                      </div>
                      {spreadType === key && (
                        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-mystic-gold animate-pulse" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* After selecting spread, show question input and start */}
              {spreadType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="w-full max-w-md flex flex-col gap-4"
                >
                  {/* Position descriptions */}
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-cinzel text-mystic-gold mb-3">
                      {spread!.name} — 各牌位含义
                    </h4>
                    <div className="space-y-2">
                      {spread!.positions.map((pos, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className="text-mystic-gold/60 font-cinzel min-w-[4rem]">{pos.label}</span>
                          <span className="text-foreground/40">{pos.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-mystic-rose/50 mb-2 block">你的问题（可选）</label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="你可以在心中默想，或者写下来..."
                      rows={3}
                      className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm resize-none focus:outline-none focus:border-mystic-gold/50 transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => setPhase("draw")}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all duration-300 font-cinzel text-lg"
                  >
                    <Shuffle className="w-5 h-5" />
                    开始抽牌
                  </button>

                  <button
                    onClick={() => setSpreadType(null)}
                    className="text-mystic-rose/40 text-xs hover:text-mystic-rose transition-colors text-center"
                  >
                    重新选择牌阵
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Phase: Draw animation ── */}
          {phase === "draw" && (
            <motion.div
              key="draw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-4">
                <h2 className="text-xl font-cinzel text-mystic-gold">
                  {spread!.name} — 抽牌仪式
                </h2>
                <p className="text-mystic-rose/40 text-xs mt-1">
                  跟随直觉，选择 {spread!.cardCount} 张呼唤你的牌
                </p>
              </div>
              <CardDrawAnimation
                cards={tarotCards}
                count={spread!.cardCount}
                onComplete={handleDrawComplete}
              />
            </motion.div>
          )}

          {/* ── Phase: Revealing ── */}
          {(phase === "revealing" || phase === "interpreting") && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-cinzel text-mystic-gold">{spread!.name}</h2>
                <p className="text-mystic-rose/40 text-xs mt-1">
                  已翻开 {flippedCount}/{cards.length} 张
                </p>
              </div>

              {/* Card grid */}
              <div className="flex flex-wrap gap-6 justify-center">
                {cards.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <TarotCard
                      card={c.card}
                      isReversed={c.isReversed}
                      isFlipped={c.flipped}
                      onClick={() => handleFlipCard(i)}
                      size="md"
                    />
                    <span className="text-xs text-mystic-rose/50 font-cinzel tracking-wider">{c.position}</span>
                    {c.flipped && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-cinzel text-mystic-gold"
                      >
                        {c.card.nameCN}
                        <span className="text-mystic-rose/60 text-xs ml-1">
                          {c.isReversed ? "逆" : "正"}
                        </span>
                      </motion.span>
                    )}
                  </div>
                ))}
              </div>

              {phase === "revealing" && flippedCount > 0 && flippedCount < cards.length && (
                <button onClick={handleFlipAll} className="text-mystic-rose/40 text-xs hover:text-mystic-rose transition-colors">
                  翻开全部
                </button>
              )}

              {/* Interpretation trigger */}
              {phase === "interpreting" && !showInterpretation && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowInterpretation(true)}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all duration-300 font-cinzel"
                >
                  <Sparkles className="w-5 h-5" />
                  获取解读
                </motion.button>
              )}

              {/* Dual-tab interpretation */}
              {showInterpretation && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xl"
                >
                  {cards.filter(c => c.flipped).length > 0 && (
                    <CardInterpretation
                      card={cards[0].card}
                      isReversed={cards[0].isReversed}
                      question={question || undefined}
                      spreadType={spread!.name}
                      allCards={cards.map(c => c.card)}
                      allReversed={cards.map(c => c.isReversed)}
                    />
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
