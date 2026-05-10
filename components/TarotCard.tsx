"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { TarotCard as TarotCardType } from "@/lib/tarot-data";

interface TarotCardProps {
  card: TarotCardType;
  isReversed: boolean;
  isFlipped: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showGlow?: boolean;
}

const sizeConfig = {
  sm: { width: "w-28", height: "h-[10.5rem]", text: "text-xs", icon: "text-2xl", padding: "p-2" },
  md: { width: "w-40", height: "h-64", text: "text-sm", icon: "text-4xl", padding: "p-3" },
  lg: { width: "w-48", height: "h-80", text: "text-base", icon: "text-5xl", padding: "p-4" },
};

const arcanaSymbols: Record<string, string> = {
  major: "✧",
  wands: "🜂",
  cups: "🜄",
  swords: "🜁",
  pentacles: "🜃",
};

const suitNames: Record<string, string> = {
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币",
};

function CardBack() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
      <div className="w-full h-full bg-gradient-to-br from-mystic-dark via-mystic-purple to-mystic-dark flex items-center justify-center border-2 border-mystic-gold/40 rounded-xl">
        <div className="absolute inset-2 rounded-lg border border-mystic-gold/20" />
        <div className="absolute inset-4 rounded-lg border border-mystic-gold/15 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 opacity-60">
            <polygon
              points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
              fill="none"
              stroke="rgba(212,168,83,0.5)"
              strokeWidth="1"
            />
            <circle cx="50" cy="48" r="15" fill="none" stroke="rgba(212,168,83,0.25)" strokeWidth="0.5" />
            <circle cx="50" cy="48" r="25" fill="none" stroke="rgba(212,168,83,0.15)" strokeWidth="0.5" />
            <circle cx="50" cy="48" r="35" fill="none" stroke="rgba(212,168,83,0.08)" strokeWidth="0.5" />
          </svg>
        </div>
        <span className="absolute top-3 left-3 text-mystic-gold/30 text-xs">⊕</span>
        <span className="absolute top-3 right-3 text-mystic-gold/30 text-xs">⊕</span>
        <span className="absolute bottom-3 left-3 text-mystic-gold/30 text-xs">⊕</span>
        <span className="absolute bottom-3 right-3 text-mystic-gold/30 text-xs">⊕</span>
      </div>
    </div>
  );
}

function CardFaceContent({ card, isReversed, size }: { card: TarotCardType; isReversed: boolean; size: "sm" | "md" | "lg" }) {
  const cfg = sizeConfig[size];
  const [imgError, setImgError] = useState(false);
  const symbol = card.arcana === "major" ? arcanaSymbols.major : arcanaSymbols[card.suit!];
  const suitCN = card.suit ? suitNames[card.suit] : "";

  return (
    <div
      className={`absolute inset-0 rounded-xl overflow-hidden`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        background: "linear-gradient(135deg, #1a0f2e 0%, #2d1b69 50%, #1a1040 100%)",
        border: "2px solid rgba(212, 168, 83, 0.35)",
        boxShadow: "inset 0 0 30px rgba(192, 132, 252, 0.15), 0 0 20px rgba(212, 168, 83, 0.1)",
      }}
    >
      {/* Rider-Waite card image */}
      {!imgError && (
        <img
          src={card.imageUrl}
          alt={card.nameCN}
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
          onError={() => setImgError(true)}
        />
      )}

      {/* Overlay gradient on top of image for text readability */}
      {!imgError && (
        <div className="absolute inset-0 bg-gradient-to-t from-mystic-dark/80 via-transparent to-transparent rounded-xl" />
      )}

      {/* SVG fallback symbol (visible only when image fails) */}
      {imgError && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${cfg.padding}`}>
          <span className={`${cfg.icon} mb-2 text-mystic-gold/80`}>{symbol}</span>

          {card.arcana === "minor" && card.number && (
            <span className="text-mystic-gold/50 text-xs mb-1">
              {card.number <= 10 ? (card.number === 1 ? "A" : String(card.number)) : ["P", "Kn", "Q", "K"][card.number - 11]}
            </span>
          )}

          <span className={`${cfg.text} font-cinzel text-mystic-gold text-center leading-tight`}>
            {card.nameCN}
          </span>

          {suitCN && <span className="text-mystic-rose/50 text-xs mt-1">{suitCN}</span>}

          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {card.keywords.slice(0, 2).map((kw) => (
              <span key={kw} className="text-[10px] text-mystic-rose/60 px-1.5 py-0.5 rounded-full border border-mystic-rose/20">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Card name overlay on image */}
      {!imgError && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <span className={`${cfg.text} font-cinzel text-mystic-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight`}>
            {card.nameCN}
          </span>
          {suitCN && (
            <span className="text-mystic-rose/70 text-xs block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {suitCN}
            </span>
          )}
        </div>
      )}

      {/* Reversed badge */}
      {isReversed && (
        <span className="absolute top-2 right-2 text-[10px] text-mystic-rose/80 border border-mystic-rose/30 rounded px-1 bg-mystic-dark/60">
          逆位
        </span>
      )}
    </div>
  );
}

export function TarotCard({
  card,
  isReversed,
  isFlipped,
  onClick,
  size = "md",
  className = "",
  showGlow = true,
}: TarotCardProps) {
  const cfg = sizeConfig[size];

  return (
    <motion.div
      className={`${cfg.width} ${cfg.height} cursor-pointer ${className} relative`}
      style={{ perspective: "800px" }}
      onClick={onClick}
      whileHover={isFlipped ? { y: -5 } : { y: -8, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* ── Breathing purple glow (unflipped) ── */}
      {!isFlipped && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 15px rgba(192,132,252,0.3), 0 0 30px rgba(192,132,252,0.1)",
              "0 0 25px rgba(192,132,252,0.5), 0 0 50px rgba(192,132,252,0.2)",
              "0 0 15px rgba(192,132,252,0.3), 0 0 30px rgba(192,132,252,0.1)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── Golden pulse glow (flipped) ── */}
      {isFlipped && showGlow && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 10px rgba(212,168,83,0.3), 0 0 20px rgba(212,168,83,0.15)",
              "0 0 20px rgba(212,168,83,0.5), 0 0 40px rgba(212,168,83,0.25)",
              "0 0 10px rgba(212,168,83,0.3), 0 0 20px rgba(212,168,83,0.15)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── 3D flip container ── */}
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          rotateZ: isFlipped && isReversed ? 180 : 0,
        }}
        transition={{
          rotateY: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
          rotateZ: { duration: 0.4, ease: "easeOut", delay: 0.7 },
        }}
      >
        {/* Card face — rotated 180deg so it shows AFTER parent flip */}
        <div style={{ transform: "rotateY(180deg)" }}>
          <CardFaceContent card={card} isReversed={isReversed} size={size} />
        </div>

        {/* Card back — at 0deg, visible when parent is un-flipped */}
        <CardBack />
      </motion.div>
    </motion.div>
  );
}
