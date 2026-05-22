"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard as TarotCardType } from "@/lib/tarot-data";

interface CardDrawAnimationProps {
  cards: TarotCardType[];
  count: number;
  onComplete: (selected: { card: TarotCardType; isReversed: boolean }[]) => void;
  layoutMode?: "fan" | "grid";
}

// Pick 20 random cards for the fan selection pool
function pickFanCards(allCards: TarotCardType[], count: number): (TarotCardType & { _isReversed: boolean })[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 20).map((c) => ({
    ...c,
    _isReversed: Math.random() < 0.5,
  }));
}

function CardBack({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className={`w-full h-full rounded-lg border-2 transition-colors duration-300 ${
        isSelected
          ? "border-mystic-gold shadow-[0_0_20px_rgba(212,168,83,0.5)]"
          : "border-mystic-gold/30 hover:border-mystic-gold/60"
      }`}
      style={{
        background: "linear-gradient(135deg, #1a0f2e, #2d1b69, #1a1040)",
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 60 100" className="w-1/2 opacity-40">
          <polygon
            points="30,5 37,25 60,25 41,38 47,58 30,45 13,58 19,38 0,25 23,25"
            fill="none"
            stroke="rgba(212,168,83,0.5)"
            strokeWidth="1"
          />
        </svg>
      </div>
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-mystic-gold text-mystic-dark text-xs flex items-center justify-center font-bold">
          ✓
        </div>
      )}
    </div>
  );
}

export function CardDrawAnimation({ cards, count, onComplete, layoutMode = "fan" }: CardDrawAnimationProps) {
  const [phase, setPhase] = useState<"shuffle" | "fan" | "selecting" | "complete">("shuffle");
  const [fanCards, setFanCards] = useState<(TarotCardType & { _isReversed: boolean })[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const fc = pickFanCards(cards, count);
    setFanCards(fc);
    const timer = setTimeout(() => setPhase("fan"), 1500);
    const timer2 = setTimeout(() => setPhase("selecting"), 2500);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [cards, count]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (phase !== "selecting") return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else if (next.size < count) {
          next.add(idx);
        }
        if (next.size >= count) {
          const result = Array.from(next).map((i) => ({
            card: fanCards[i],
            isReversed: fanCards[i]._isReversed,
          }));
          setTimeout(() => onComplete(result), 500);
          setPhase("complete");
        }
        return next;
      });
    },
    [phase, count, fanCards, onComplete]
  );

  const angleRange = 60; // total fan angle in degrees
  const startAngle = -angleRange / 2;

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-8 py-1 sm:py-8">
      {/* Shuffle phase */}
      <AnimatePresence>
        {phase === "shuffle" && (
          <motion.div
            key="shuffle"
            className="relative w-40 h-64"
            exit={{ opacity: 0 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-xl border-2 border-mystic-gold/40 bg-gradient-to-br from-mystic-dark via-mystic-purple to-mystic-dark"
                animate={{
                  rotate: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
                  x: [0, Math.random() * 20 - 10, 0],
                  y: [0, Math.random() * 15 - 7, 0],
                }}
                transition={{ duration: 0.3, repeat: 4 }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.p
                className="text-mystic-gold/80 font-cinzel text-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                洗牌中...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fan spread / Grid layout */}
      <AnimatePresence>
        {(phase === "fan" || phase === "selecting" || phase === "complete") && (
          layoutMode === "fan" ? (
            <div className="relative flex justify-center w-full overflow-x-hidden min-h-[180px] sm:min-h-[280px]">
              <div className="relative fan-container">
                {fanCards.map((card, idx) => {
                  const angle = startAngle + (angleRange * idx) / (fanCards.length - 1);
                  const isSelected = selected.has(idx);
                  const isHovered = hoveredIdx === idx;

                  return (
                    <motion.div
                      key={idx}
                      className="absolute cursor-pointer fan-card"
                      style={{
                        bottom: "0px",
                        left: "50%",
                        transformOrigin: "bottom center",
                      }}
                      initial={{ rotate: 0, x: "-50%", y: 50, opacity: 0 }}
                      animate={{
                        rotate: angle,
                        x: `calc(-50% + ${Math.sin((angle * Math.PI) / 180) * 240}px)`,
                        y: isSelected ? -30 : isHovered ? -15 : 0,
                        opacity: 1,
                        scale: isSelected ? 1.08 : isHovered ? 1.05 : 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        delay: phase === "fan" ? idx * 0.03 : 0,
                      }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleSelect(idx)}
                    >
                      <CardBack isSelected={isSelected} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Grid layout — 2 rows, CSS grid */
            <div className="relative flex justify-center w-full overflow-x-auto min-h-[180px] sm:min-h-[280px] py-4">
              <div
                className="grid-container"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.ceil(fanCards.length / 2)}, 1fr)`,
                  gridTemplateRows: "repeat(2, auto)",
                  gap: "12px",
                  justifyItems: "center",
                  alignItems: "center",
                }}
              >
                {fanCards.map((card, idx) => {
                  const isSelected = selected.has(idx);
                  const isHovered = hoveredIdx === idx;
                  return (
                    <motion.div
                      key={idx}
                      className="cursor-pointer grid-card"
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        y: isSelected ? -8 : 0,
                        scale: isSelected ? 1.08 : isHovered ? 1.05 : 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        delay: phase === "fan" ? idx * 0.03 : 0,
                      }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleSelect(idx)}
                    >
                      <CardBack isSelected={isSelected} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </AnimatePresence>

      {/* Instruction text */}
      {phase === "selecting" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-mystic-rose/75 text-sm"
        >
          请从{layoutMode === "fan" ? "扇形" : "平铺"}牌阵中选择 {count} 张牌（已选 {selected.size}/{count}）
        </motion.p>
      )}
    </div>
  );
}
