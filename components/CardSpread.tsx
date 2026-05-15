"use client";

import { motion } from "framer-motion";
import { TarotCard } from "./TarotCard";
import type { TarotCard as TarotCardType } from "@/lib/tarot-data";

interface CardInPosition {
  card: TarotCardType;
  isReversed: boolean;
  position: string;
  flipped: boolean;
}

interface CardSpreadProps {
  cards: CardInPosition[];
  spreadType: "three-card" | "celtic-cross" | "relationship" | "yes-no" | "horseshoe" | "zodiac" | "custom";
  onFlipCard: (index: number) => void;
}

const celticPositions = [
  "当下 (Present)",
  "阻碍 (Challenge)",
  "过去 (Past)",
  "未来 (Future)",
  "意识之上 (Above)",
  "意识之下 (Below)",
  "建议 (Advice)",
  "外部环境 (External)",
  "希望与恐惧 (Hopes/Fears)",
  "结果 (Outcome)",
];

export function CardSpread({ cards, spreadType, onFlipCard }: CardSpreadProps) {
  // Celtic Cross gets its custom layout; all other spreads use the generic grid
  if (spreadType !== "celtic-cross") {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="flex gap-6 md:gap-8 flex-wrap justify-center">
          {cards.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <TarotCard
                card={c.card}
                isReversed={c.isReversed}
                isFlipped={c.flipped}
                onClick={() => onFlipCard(i)}
                size="md"
              />
              <span className="text-xs text-text-secondary font-cinzel tracking-wider">{c.position}</span>
              {c.flipped && (
                <span className="text-sm font-cinzel text-mystic-gold">{c.card.nameCN}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Celtic Cross layout
  // Standard arrangement:
  //           [4] Above (conscious goals)
  // [2] Past   [0] Present ─┐          [9] Outcome       ┐
  // [3] Future              [1] Challenge (crossed)      │ Staff ↑
  //           [5] Below (subconscious)  [8] Hopes/Fears   │ (read
  //                                     [7] External      │ bottom
  //                                     [6] Advice        ┘ to top)
  return (
    <div className="relative w-full max-w-3xl mx-auto" style={{ minHeight: "600px" }}>
      {/* ── Center Cross ── */}
      <div className="absolute left-[38%] top-[44%] -translate-x-1/2 -translate-y-1/2" style={{ width: "112px", height: "168px" }}>
        {/* Card 0 — Present (upright, centered) */}
        <div className="flex flex-col items-center gap-1">
          <TarotCard
            card={cards[0].card}
            isReversed={cards[0].isReversed}
            isFlipped={cards[0].flipped}
            onClick={() => onFlipCard(0)}
            size="sm"
          />
          <span className="text-[10px] text-text-secondary">{celticPositions[0]}</span>
        </div>
        {/* Card 1 — Challenge (rotated 90°, crossing over Present) */}
        <div
          className="absolute top-1/2 left-1/2 flex flex-col items-center gap-1"
          style={{
            transform: "translate(-50%, -50%) rotate(90deg)",
            width: "168px",
            height: "112px",
          }}
        >
          <TarotCard
            card={cards[1].card}
            isReversed={cards[1].isReversed}
            isFlipped={cards[1].flipped}
            onClick={() => onFlipCard(1)}
            size="sm"
          />
          <span className="text-[10px] text-text-secondary">{celticPositions[1]}</span>
        </div>
      </div>

      {/* ── Top: Card 4 (Above / Conscious Goals) ── */}
      <div className="absolute left-[38%] top-1 -translate-x-1/2 flex flex-col items-center gap-1">
        <TarotCard
          card={cards[4].card}
          isReversed={cards[4].isReversed}
          isFlipped={cards[4].flipped}
          onClick={() => onFlipCard(4)}
          size="sm"
        />
        <span className="text-[10px] text-text-secondary">{celticPositions[4]}</span>
      </div>

      {/* ── Bottom: Card 5 (Below / Subconscious) ── */}
      <div className="absolute left-[38%] bottom-1 -translate-x-1/2 flex flex-col items-center gap-1">
        <TarotCard
          card={cards[5].card}
          isReversed={cards[5].isReversed}
          isFlipped={cards[5].flipped}
          onClick={() => onFlipCard(5)}
          size="sm"
        />
        <span className="text-[10px] text-text-secondary">{celticPositions[5]}</span>
      </div>

      {/* ── Left Column: Cards 2 (Past), 3 (Future) ── */}
      <div className="absolute left-[4%] top-1/2 -translate-y-1/2 flex flex-col gap-6">
        {[2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <TarotCard
              card={cards[i].card}
              isReversed={cards[i].isReversed}
              isFlipped={cards[i].flipped}
              onClick={() => onFlipCard(i)}
              size="sm"
            />
            <span className="text-[10px] text-text-secondary">{celticPositions[i]}</span>
          </div>
        ))}
      </div>

      {/* ── Right Staff (bottom→top): Cards 6→7→8→9 ── */}
      <div className="absolute right-[4%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <span className="text-[10px] text-mystic-gold/40 tracking-wider mb-1">权杖 Staff ↓</span>
        {[9, 8, 7, 6].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary w-20 text-right">{celticPositions[i]}</span>
            <TarotCard
              card={cards[i].card}
              isReversed={cards[i].isReversed}
              isFlipped={cards[i].flipped}
              onClick={() => onFlipCard(i)}
              size="sm"
            />
          </div>
        ))}
        <span className="text-[10px] text-mystic-gold/40 tracking-wider mt-1">↑ 阅读方向</span>
      </div>
    </div>
  );
}
