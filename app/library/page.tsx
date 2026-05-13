"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, X, Search, ChevronDown } from "lucide-react";
import { tarotCards, getMajorArcana, getCardsBySuit, type TarotCard } from "@/lib/tarot-data";

const filters = [
  { key: "all", label: "全部", icon: "🃏" },
  { key: "major", label: "大阿卡纳", icon: "✧" },
  { key: "wands", label: "权杖", icon: "🜂" },
  { key: "cups", label: "圣杯", icon: "🜄" },
  { key: "swords", label: "宝剑", icon: "🜁" },
  { key: "pentacles", label: "星币", icon: "🜃" },
] as const;

type FilterKey = typeof filters[number]["key"];

function getCards(filter: FilterKey): TarotCard[] {
  switch (filter) {
    case "major": return getMajorArcana();
    case "wands": return getCardsBySuit("wands");
    case "cups": return getCardsBySuit("cups");
    case "swords": return getCardsBySuit("swords");
    case "pentacles": return getCardsBySuit("pentacles");
    default: return tarotCards;
  }
}

const dimensionLabels: Record<string, { label: string; icon: string }> = {
  general: { label: "综合解读", icon: "🌟" },
  love: { label: "感情运势", icon: "💕" },
  career: { label: "事业学业", icon: "💼" },
  finance: { label: "财运分析", icon: "💰" },
  advice: { label: "行动建议", icon: "💡" },
};

function CardDetailModal({ card, onClose }: { card: TarotCard; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<string>("general");
  const [orientation, setOrientation] = useState<"upright" | "reversed">("upright");
  const interp = card.interpretation[orientation];
  const keys = Object.keys(interp) as (keyof typeof interp)[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card p-6 my-8 w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-mystic-dark/80 text-mystic-rose/50 hover:text-mystic-rose transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card image + header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-32 h-48 rounded-xl overflow-hidden border-2 border-mystic-gold/30">
            <img
              src={card.imageUrl}
              alt={card.nameCN}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-cinzel text-mystic-gold">{card.nameCN}</h2>
            <p className="text-xs text-mystic-rose/50">{card.name}</p>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-mystic-rose/70">
              {card.arcana === "major" ? "大阿卡纳" : "小阿卡纳"}
            </span>
            {card.suit && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-mystic-rose/70">
                {card.suit === "wands" ? "权杖" : card.suit === "cups" ? "圣杯" : card.suit === "swords" ? "宝剑" : "星币"}
              </span>
            )}
            {card.element && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-mystic-rose/70">
                {card.element}元素
              </span>
            )}
            {card.planet && (
              <span className="px-2 py-0.5 rounded-full bg-mystic-purple/30 text-mystic-rose/70">
                {card.planet}
              </span>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
          {card.keywords.map((kw, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-mystic-gold/10 text-mystic-gold/70 text-[11px]">
              {kw}
            </span>
          ))}
        </div>

        {/* Orientation tabs */}
        <div className="flex border-b border-mystic-purple/20 mb-4">
          <button
            onClick={() => setOrientation("upright")}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-[1px] ${
              orientation === "upright"
                ? "border-mystic-gold text-mystic-gold"
                : "border-transparent text-foreground/40 hover:text-foreground/60"
            }`}
          >
            正位 Upright
          </button>
          <button
            onClick={() => setOrientation("reversed")}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-[1px] ${
              orientation === "reversed"
                ? "border-mystic-gold text-mystic-gold"
                : "border-transparent text-foreground/40 hover:text-foreground/60"
            }`}
          >
            逆位 Reversed
          </button>
        </div>

        {/* One-line meaning */}
        <p className="text-xs text-foreground/60 italic text-center mb-4">
          {orientation === "upright" ? card.uprightMeaning : card.reversedMeaning}
        </p>

        {/* 5-dimension accordion */}
        <div className="space-y-2">
          {keys.map((key) => {
            const dim = dimensionLabels[key];
            if (!dim) return null;
            const isOpen = openSection === key;
            return (
              <div key={key} className="border border-mystic-purple/15 rounded-md overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? "" : key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-mystic-purple/10 transition-colors"
                >
                  <span className="text-xs font-cinzel text-mystic-gold/80 flex items-center gap-1.5">
                    <span>{dim.icon}</span>
                    {dim.label}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-mystic-rose/40 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 text-xs text-foreground/80 leading-relaxed border-t border-mystic-purple/10 pt-2">
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
            <p className="text-[10px] text-mystic-rose/40 mb-1">牌面象征</p>
            <p className="text-[10px] text-foreground/45 italic">{card.symbolism}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);

  const cards = getCards(filter).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.nameCN.includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-mystic-rose/60 hover:text-mystic-gold transition-colors text-sm mb-6 px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-cinzel text-mystic-gold text-glow">塔罗图鉴</h1>
          <p className="text-mystic-rose/50 text-sm mt-2">探索全部 78 张 Rider-Waite 塔罗牌</p>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索牌名或关键词..."
            className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mystic-rose/30 hover:text-mystic-rose/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                filter === f.key
                  ? "bg-mystic-gold/15 border border-mystic-gold/40 text-mystic-gold"
                  : "border border-mystic-purple/20 text-mystic-rose/50 hover:border-mystic-rose/30 hover:text-mystic-rose/70"
              }`}
            >
              <span className="mr-1.5">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Card count */}
        <p className="text-center text-xs text-mystic-rose/30 mb-6">
          {cards.length} 张牌
        </p>

        {/* Card grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <motion.button
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelectedCard(card)}
                className="glass-card overflow-hidden hover:border-mystic-gold/40 transition-all duration-300 group text-left"
              >
                {/* Card image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={card.imageUrl}
                    alt={card.nameCN}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                {/* Card info */}
                <div className="p-3">
                  <h3 className="text-sm font-cinzel text-mystic-gold/90 truncate">{card.nameCN}</h3>
                  <p className="text-[10px] text-mystic-rose/40 mt-0.5">{card.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {card.keywords.slice(0, 2).map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-mystic-purple/20 text-mystic-rose/50 text-[9px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No results */}
        {cards.length === 0 && (
          <div className="text-center py-20">
            <p className="text-mystic-rose/40 text-sm">没有找到匹配的牌</p>
          </div>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {selectedCard && (
            <CardDetailModal
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
