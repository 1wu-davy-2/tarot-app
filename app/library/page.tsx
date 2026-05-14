"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, X, Search, ChevronDown, Brain } from "lucide-react";
import { tarotCards, getMajorArcana, getCardsBySuit, type TarotCard } from "@/lib/tarot-data";
import { getCollectedCount, getCollectedMajorCount } from "@/lib/achievements";
import { getQuizStats, getLearnedCards, SUIT_LABELS, SUIT_TOTALS } from "@/lib/quiz-generator";
import { QuizModal } from "@/components/QuizModal";
import { getCardImageUrl } from "@/lib/deck-themes";

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

function LearningStats() {
  const stats = getQuizStats();
  const learned = getLearnedCards();

  const suitCounts: Record<string, number> = { major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 };
  for (const id of learned) {
    const card = tarotCards.find((c) => c.id === id);
    if (!card) continue;
    if (card.arcana === "major") suitCounts.major++;
    else if (card.suit) suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }
  const totalLearned = learned.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <p className="text-xs font-cinzel text-mystic-gold mb-3 text-center">
        📊 学习统计
      </p>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-mystic-purple/10">
          <p className="text-lg font-bold text-mystic-gold">{totalLearned}/78</p>
          <p className="text-[9px] text-mystic-rose/55">已掌握</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-mystic-purple/10">
          <p className="text-lg font-bold text-mystic-gold">{stats.avgScore}%</p>
          <p className="text-[9px] text-mystic-rose/55">均分</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-mystic-purple/10">
          <p className="text-lg font-bold text-mystic-gold">{stats.bestScore}%</p>
          <p className="text-[9px] text-mystic-rose/55">最佳</p>
        </div>
      </div>

      {/* Per-suit progress */}
      <div className="space-y-1.5">
        {Object.entries(suitCounts).map(([key, count]) => {
          const pct = Math.round((count / (SUIT_TOTALS[key] || 1)) * 100);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-mystic-rose/55 w-12 shrink-0">{SUIT_LABELS[key]}</span>
              <div className="flex-1 h-1.5 rounded-full bg-mystic-purple/15 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[10px] text-mystic-rose/45 w-8 text-right">{count}/{SUIT_TOTALS[key]}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function CollectionProgress() {
  const total = getCollectedCount();
  const major = getCollectedMajorCount();
  const totalPct = Math.round((total / 78) * 100);
  const majorPct = Math.round((major / 22) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-6 max-w-md mx-auto"
    >
      <p className="text-xs font-cinzel text-mystic-gold mb-2 text-center">
        🃏 牌库收集进度
      </p>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-mystic-rose/55 mb-0.5">
            <span>全部 78 张</span>
            <span>{total}/78 ({totalPct}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-mystic-purple/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
              initial={{ width: 0 }}
              animate={{ width: `${totalPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-mystic-rose/55 mb-0.5">
            <span>大阿卡纳</span>
            <span>{major}/22 ({majorPct}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-mystic-purple/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-mystic-gold to-mystic-rose"
              initial={{ width: 0 }}
              animate={{ width: `${majorPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
          className="absolute top-4 right-4 p-1 rounded-full bg-mystic-dark/80 text-mystic-rose/65 hover:text-mystic-rose transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card image + header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-32 h-48 rounded-xl overflow-hidden border-2 border-mystic-gold/30">
            <img
              src={getCardImageUrl(card.imageUrl)}
              alt={card.nameCN}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-cinzel text-mystic-gold">{card.nameCN}</h2>
            <p className="text-xs text-mystic-rose/65">{card.name}</p>
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
                : "border-transparent text-foreground/55 hover:text-foreground/75"
            }`}
          >
            正位 Upright
          </button>
          <button
            onClick={() => setOrientation("reversed")}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-[1px] ${
              orientation === "reversed"
                ? "border-mystic-gold text-mystic-gold"
                : "border-transparent text-foreground/55 hover:text-foreground/75"
            }`}
          >
            逆位 Reversed
          </button>
        </div>

        {/* One-line meaning */}
        <p className="text-xs text-foreground/75 italic text-center mb-4">
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
                    className={`w-3 h-3 text-mystic-rose/55 transition-transform duration-200 ${
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
            <p className="text-[10px] text-mystic-rose/55 mb-1">牌面象征</p>
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
  const [quizOpen, setQuizOpen] = useState(false);

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
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-mystic-rose/75 hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-xl sm:text-3xl font-cinzel text-mystic-gold text-glow">塔罗图鉴</h1>
          </motion.div>
          <div className="w-[60px]" />
        </div>
        <p className="text-mystic-rose/65 text-xs text-center -mt-4 mb-6">探索全部 78 张 Rider-Waite 塔罗牌</p>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索牌名或关键词..."
            className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/45 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mystic-rose/45 hover:text-mystic-rose/75"
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
                  : "border border-mystic-purple/20 text-mystic-rose/65 hover:border-mystic-rose/30 hover:text-mystic-rose/70"
              }`}
            >
              <span className="mr-1.5">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Card count */}
        <p className="text-center text-xs text-mystic-rose/45 mb-4">
          {cards.length} 张牌
        </p>

        {/* Collection progress */}
        <CollectionProgress />

        {/* Quiz button + Learning stats */}
        <div className="max-w-md mx-auto mb-6 space-y-3">
          <button
            onClick={() => setQuizOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-mystic-gold/30 bg-mystic-gold/10 text-mystic-gold hover:bg-mystic-gold/15 transition-all text-sm"
          >
            <Brain className="w-4 h-4" />
            牌意测验
          </button>
          <LearningStats />
        </div>

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
                    src={getCardImageUrl(card.imageUrl)}
                    alt={card.nameCN}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                {/* Card info */}
                <div className="p-3">
                  <h3 className="text-sm font-cinzel text-mystic-gold/90 truncate">{card.nameCN}</h3>
                  <p className="text-[10px] text-mystic-rose/55 mt-0.5">{card.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {card.keywords.slice(0, 2).map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-mystic-purple/20 text-mystic-rose/65 text-[9px]">
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
            <p className="text-mystic-rose/55 text-sm">没有找到匹配的牌</p>
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

        {/* Quiz modal */}
        <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} />
      </div>
    </div>
  );
}
