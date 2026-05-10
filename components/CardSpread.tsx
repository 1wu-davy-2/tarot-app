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
  spreadType: "three-card" | "celtic-cross";
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
  if (spreadType === "three-card") {
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
              <span className="text-xs text-mystic-rose/60 font-cinzel tracking-wider">{c.position}</span>
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
  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ minHeight: "500px" }}>
      {/* Center cross: positions 0 and 1 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
        <div className="flex flex-col items-center gap-1">
          <TarotCard
            card={cards[0].card}
            isReversed={cards[0].isReversed}
            isFlipped={cards[0].flipped}
            onClick={() => onFlipCard(0)}
            size="sm"
          />
          <span className="text-[10px] text-mystic-rose/50">{celticPositions[0]}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rotate-90">
          <TarotCard
            card={cards[1].card}
            isReversed={cards[1].isReversed}
            isFlipped={cards[1].flipped}
            onClick={() => onFlipCard(1)}
            size="sm"
          />
          <span className="text-[10px] text-mystic-rose/50 rotate-90">{celticPositions[1]}</span>
        </div>
      </div>

      {/* Left column: positions 2, 3 */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        {[2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <TarotCard
              card={cards[i].card}
              isReversed={cards[i].isReversed}
              isFlipped={cards[i].flipped}
              onClick={() => onFlipCard(i)}
              size="sm"
            />
            <span className="text-[10px] text-mystic-rose/50">{celticPositions[i]}</span>
          </div>
        ))}
      </div>

      {/* Right column: positions 4-9 */}
      <div className="absolute right-0 top-0 flex flex-col gap-3">
        {[4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-mystic-rose/50 w-20 text-right">{celticPositions[i]}</span>
            <TarotCard
              card={cards[i].card}
              isReversed={cards[i].isReversed}
              isFlipped={cards[i].flipped}
              onClick={() => onFlipCard(i)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
