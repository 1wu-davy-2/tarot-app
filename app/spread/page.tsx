"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shuffle, Sparkles, Clock, Layers, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { TarotCard } from "@/components/TarotCard";
import { CardDrawAnimation } from "@/components/CardDrawAnimation";
import { CardInterpretation } from "@/components/CardInterpretation";
import { tarotCards, type TarotCard as TarotCardType } from "@/lib/tarot-data";
import { saveReading, updateReading } from "@/lib/reading-history";
import { isLoggedIn, apiSaveReading } from "@/lib/api-client";

type SpreadType = "three-card" | "celtic-cross" | "relationship" | "yes-no" | "horseshoe" | "zodiac" | "custom";

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
  "relationship": {
    name: "关系牌阵",
    subtitle: "Relationship Spread",
    description: "深入分析双方关系动态，揭示彼此的需求与未来走向",
    icon: "\u{1F491}",
    cardCount: 7,
    difficulty: "进阶",
    time: "10分钟",
    bestFor: "感情关系、人际分析",
    positions: [
      { label: "你的视角", sublabel: "Your View", desc: "你如何看待这段关系以及你在其中的状态" },
      { label: "对方视角", sublabel: "Partner View", desc: "对方如何看待这段关系以及TA的状态" },
      { label: "关系现状", sublabel: "Current State", desc: "关系当前的核心能量与连接质量" },
      { label: "你的需求", sublabel: "Your Needs", desc: "你内心真正的渴望与诉求" },
      { label: "对方需求", sublabel: "Partner Needs", desc: "对方内心真正的渴望与诉求" },
      { label: "阻碍挑战", sublabel: "Obstacles", desc: "关系中需要面对的主要障碍" },
      { label: "关系未来", sublabel: "Future", desc: "关系的潜在发展趋势" },
    ],
  },
  "yes-no": {
    name: "是否牌阵",
    subtitle: "Yes / No Spread",
    description: "对具体问题给出明确的倾向性指引，帮助你做出决策",
    icon: "\u{2696}\u{FE0F}",
    cardCount: 5,
    difficulty: "入门",
    time: "5分钟",
    bestFor: "具体问题、决策判断",
    positions: [
      { label: "问题本质", sublabel: "Core Issue", desc: "问题的真实面貌与核心要素" },
      { label: "有利因素", sublabel: "Favorable", desc: "支持你的力量与可利用的机会" },
      { label: "不利因素", sublabel: "Unfavorable", desc: "阻碍你的力量与潜在风险" },
      { label: "发展趋势", sublabel: "Trend", desc: "事情的自然走向与倾向" },
      { label: "最终建议", sublabel: "Advice", desc: "如何做出最有利于自己的决策" },
    ],
  },
  "horseshoe": {
    name: "马蹄铁牌阵",
    subtitle: "Horseshoe Spread",
    description: "经典弧形七牌阵，揭示问题从过去到未来的完整脉络",
    icon: "\u{1F9F2}",
    cardCount: 7,
    difficulty: "进阶",
    time: "10分钟",
    bestFor: "问题分析、局势推演",
    positions: [
      { label: "过去影响", sublabel: "Past", desc: "导致当前局面的过往因素与根基" },
      { label: "当前状况", sublabel: "Present", desc: "现在的核心状态与能量" },
      { label: "隐藏因素", sublabel: "Hidden", desc: "尚未显现的潜在影响与暗流" },
      { label: "主要障碍", sublabel: "Obstacle", desc: "需要正视和跨越的挑战" },
      { label: "环境态度", sublabel: "Environment", desc: "周围环境、他人的态度与影响" },
      { label: "行动建议", sublabel: "Advice", desc: "当前阶段的最佳行动方向" },
      { label: "可能结果", sublabel: "Outcome", desc: "按当前趋势最可能的发展结果" },
    ],
  },
  "zodiac": {
    name: "黄道十二宫",
    subtitle: "Zodiac Spread",
    description: "对应星盘十二宫位，全方位深度解析人生各个领域",
    icon: "\u{1F30C}",
    cardCount: 12,
    difficulty: "高阶",
    time: "20分钟",
    bestFor: "年度运势、全面人生分析",
    positions: [
      { label: "自我身份", sublabel: "1st House", desc: "外在形象、自我认同与个人风格" },
      { label: "财务价值", sublabel: "2nd House", desc: "财富、物质资源与自我价值感" },
      { label: "沟通学习", sublabel: "3rd House", desc: "思维模式、表达方式与知识获取" },
      { label: "家庭根基", sublabel: "4th House", desc: "家庭关系、情感安全感与内心根基" },
      { label: "创造快乐", sublabel: "5th House", desc: "创造力、浪漫情感与生活中的乐趣" },
      { label: "健康工作", sublabel: "6th House", desc: "日常习惯、身体健康与服务意识" },
      { label: "关系合作", sublabel: "7th House", desc: "伴侣关系、合作伙伴与一对一互动" },
      { label: "变革深度", sublabel: "8th House", desc: "深层转变、共享资源与神秘体验" },
      { label: "探索信念", sublabel: "9th House", desc: "远行探索、哲学信念与精神追求" },
      { label: "事业声望", sublabel: "10th House", desc: "职业事业、社会地位与公众形象" },
      { label: "社群愿景", sublabel: "11th House", desc: "社交圈层、理想抱负与团体归属" },
      { label: "灵性潜意识", sublabel: "12th House", desc: "潜意识模式、灵性连接与内在隐退" },
    ],
  },
} as const;

type SpreadEntry = typeof SPREADS[keyof typeof SPREADS];

interface CustomSpreadEntry {
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  cardCount: number;
  difficulty: string;
  time: string;
  bestFor: string;
  positions: { label: string; sublabel: string; desc: string }[];
}

const CUSTOM_SPREADS_KEY = "tarot-custom-spreads";

function loadCustomSpreads(): Record<string, CustomSpreadEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_SPREADS_KEY);
    return raw ? JSON.parse(raw) as Record<string, CustomSpreadEntry> : {};
  } catch {
    return {};
  }
}

function saveCustomSpreads(spreads: Record<string, CustomSpreadEntry>) {
  try {
    localStorage.setItem(CUSTOM_SPREADS_KEY, JSON.stringify(spreads));
  } catch { /* quota exceeded */ }
}

export default function SpreadPage() {
  const [spreadType, setSpreadType] = useState<SpreadType | null>(null);
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<CardState[]>([]);
  const [phase, setPhase] = useState<"select-type" | "draw" | "revealing" | "interpreting">("select-type");
  const [flippedCount, setFlippedCount] = useState(0);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [aiText, setAiText] = useState("");

  // Custom spread builder state
  const [customSpreads, setCustomSpreads] = useState<Record<string, CustomSpreadEntry>>({});
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderName, setBuilderName] = useState("");
  const [builderCardCount, setBuilderCardCount] = useState(3);
  const [builderPositionLabels, setBuilderPositionLabels] = useState<string[]>(Array(3).fill(""));

  // Load custom spreads on mount
  useEffect(() => { setCustomSpreads(loadCustomSpreads()); }, []);

  // Update position labels count when card count changes
  const updateBuilderCardCount = (count: number) => {
    setBuilderCardCount(count);
    setBuilderPositionLabels((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  };

  // Create a custom spread
  const handleCreateCustom = () => {
    const name = builderName.trim() || "自定义牌阵";
    const positions = builderPositionLabels.map((label, i) => ({
      label: label.trim() || `位置 ${i + 1}`,
      sublabel: `Pos ${i + 1}`,
      desc: label.trim() ? `${label}的能量状态` : `第 ${i + 1} 个牌位的能量状态`,
    }));

    const entry: CustomSpreadEntry = {
      name,
      subtitle: "Custom Spread",
      description: `${builderCardCount}张牌的自定义牌阵`,
      icon: "✨",
      cardCount: builderCardCount,
      difficulty: "自定义",
      time: `${builderCardCount * 2}分钟`,
      bestFor: "自由探索",
      positions,
    };

    const id = `custom-${Date.now()}`;
    const updated = { ...customSpreads, [id]: entry };
    setCustomSpreads(updated);
    saveCustomSpreads(updated);
    setSpreadType("custom" as SpreadType);
    setShowBuilder(false);
  };

  // Delete a custom spread
  const handleDeleteCustom = (id: string) => {
    const updated = { ...customSpreads };
    delete updated[id];
    setCustomSpreads(updated);
    saveCustomSpreads(updated);
    if (spreadType === "custom") setSpreadType(null);
  };

  // Merge built-in and custom spreads
  const allSpreads: Record<string, SpreadEntry | CustomSpreadEntry> = { ...SPREADS, ...customSpreads };
  const builtInKeys = Object.keys(SPREADS) as (keyof typeof SPREADS)[];
  const customKeys = Object.keys(customSpreads);

  // Split spreads: basic (always visible) vs advanced (collapsible)
  const basicKeys = builtInKeys.filter(k => k === "three-card" || k === "celtic-cross");
  const advancedKeys = builtInKeys.filter(k => k !== "three-card" && k !== "celtic-cross");
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Auto-scroll to question input when a spread is selected
  const questionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (spreadType && questionRef.current) {
      setTimeout(() => {
        questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [spreadType]);

  // Save reading to history
  const spreadSaved = useRef(false);
  const spreadId = useRef("");
  useEffect(() => {
    if (showInterpretation && cards.length > 0 && !spreadSaved.current) {
      spreadSaved.current = true;
      spreadId.current = String(Date.now());
      const cfg = spreadType ? allSpreads[spreadType] : null;
      const stdText = cards
        .map((c) => {
          const interp = c.isReversed ? c.card.interpretation.reversed : c.card.interpretation.upright;
          return [
            `【${c.position}】${c.card.nameCN}（${c.isReversed ? "逆位" : "正位"}）`,
            `🌟 综合解读：${interp.general}`,
            `💕 感情运势：${interp.love}`,
            `💼 事业学业：${interp.career}`,
            `💰 财运分析：${interp.finance}`,
            `💡 行动建议：${interp.advice}`,
          ].join("\n");
        })
        .join("\n\n");
      saveReading({
        id: spreadId.current,
        date: new Date().toISOString(),
        spreadType: cfg?.name || "自定义牌阵",
        question: question || undefined,
        cards: cards.map((c) => ({
          nameCN: c.card.nameCN,
          imageUrl: c.card.imageUrl,
          isReversed: c.isReversed,
          position: c.position,
        })),
        standardInterpretation: stdText,
      });
    }
  }, [showInterpretation, cards, question, spreadType, allSpreads]);

  const backendSaved = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (aiText && spreadSaved.current && spreadId.current) {
      updateReading(spreadId.current, { aiInterpretation: aiText });
      // Debounce backend save — only save after 3s of no text changes
      if (isLoggedIn() && !backendSaved.current) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          apiSaveReading({
            question: question || "",
            ai_response: aiText,
            spread_type: (spreadType && allSpreads[spreadType]?.name) || "自定义牌阵",
            cards: cards.map((c) => ({
              nameCN: c.card.nameCN,
              imageUrl: c.card.imageUrl,
              isReversed: c.isReversed,
              position: c.position,
            })),
          }).catch(() => {});
          backendSaved.current = true;
        }, 3000);
      }
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [aiText]);

  const spread = spreadType ? allSpreads[spreadType] : null;

  const handleDrawComplete = useCallback(
    (selected: { card: TarotCardType; isReversed: boolean }[]) => {
      const config = allSpreads[spreadType!];
      const positions = (config as SpreadEntry).positions.map((p: { label: string; sublabel: string }) => `${p.label} (${p.sublabel})`);

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

              {/* Spread selection */}
              {!showBuilder && (
                <div className="w-full max-w-2xl flex flex-col gap-8">
                  {/* ── Basic spreads (always visible) ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {basicKeys.map((key) => {
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

                  {/* ── Advanced spreads ── */}
                  <div className="border-t border-mystic-purple/20 pt-4">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between px-2 py-2 hover:bg-mystic-purple/10 rounded-lg transition-colors"
                    >
                      <span className="text-xs font-cinzel text-mystic-gold/60 tracking-wider">高级牌阵</span>
                      <ChevronDown
                        className={`w-4 h-4 text-mystic-rose/40 transition-transform duration-300 ${
                          showAdvanced ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 pb-1">
                            {/* Advanced built-in spreads — compact cards */}
                            {advancedKeys.map((key) => {
                              const s = SPREADS[key];
                              return (
                                <motion.button
                                  key={key}
                                  onClick={() => setSpreadType(key)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 group ${
                                    spreadType === key
                                      ? "border-mystic-gold/60 bg-mystic-gold/5"
                                      : "border-mystic-purple/20 bg-mystic-dark/30 hover:border-mystic-gold/30"
                                  }`}
                                  whileHover={{ y: -1 }}
                                >
                                  <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{s.icon}</span>
                                  <div className="text-left min-w-0">
                                    <p className="text-sm font-cinzel text-mystic-gold/90 truncate">{s.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-mystic-rose/40">{s.cardCount}张</span>
                                      <span className="text-[10px] text-mystic-rose/30">{s.difficulty}</span>
                                    </div>
                                  </div>
                                  {spreadType === key && (
                                    <div className="w-2 h-2 rounded-full bg-mystic-gold animate-pulse shrink-0 ml-auto" />
                                  )}
                                </motion.button>
                              );
                            })}

                            {/* Custom spreads — compact cards */}
                            {customKeys.map((key) => {
                              const s = customSpreads[key];
                              const isSelected = spreadType === key;
                              return (
                                <motion.button
                                  key={key}
                                  onClick={() => setSpreadType(key as SpreadType)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 group ${
                                    isSelected
                                      ? "border-mystic-gold/60 bg-mystic-gold/5"
                                      : "border-mystic-purple/20 bg-mystic-dark/30 hover:border-mystic-gold/30"
                                  }`}
                                  whileHover={{ y: -1 }}
                                >
                                  <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{s.icon}</span>
                                  <div className="text-left min-w-0 flex-1">
                                    <p className="text-sm font-cinzel text-mystic-gold/90 truncate">{s.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-mystic-rose/40">{s.cardCount}张</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCustom(key); }}
                                    className="text-mystic-rose/20 hover:text-mystic-rose/60 transition-colors shrink-0"
                                    title="删除"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-mystic-gold animate-pulse shrink-0" />
                                  )}
                                </motion.button>
                              );
                            })}

                            {/* Create custom spread — compact */}
                            <motion.button
                              onClick={() => {
                                setShowBuilder(true);
                                setSpreadType(null);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-mystic-rose/20 hover:border-mystic-rose/50 transition-all duration-300 group bg-mystic-dark/20"
                              whileHover={{ y: -1 }}
                            >
                              <Plus className="w-5 h-5 text-mystic-rose/30 group-hover:text-mystic-rose/60 transition-colors" />
                              <span className="text-xs text-mystic-rose/40 group-hover:text-mystic-rose/70 transition-colors">
                                自定义
                              </span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Custom spread builder */}
              {showBuilder && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 w-full max-w-md flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-cinzel text-mystic-gold">创建自定义牌阵</h3>
                    <button
                      onClick={() => setShowBuilder(false)}
                      className="text-mystic-rose/40 hover:text-mystic-rose transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Spread name */}
                  <div>
                    <label className="text-xs text-mystic-rose/50 mb-2 block">牌阵名称</label>
                    <input
                      value={builderName}
                      onChange={(e) => setBuilderName(e.target.value)}
                      placeholder="给你的牌阵取个名字"
                      className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                    />
                  </div>

                  {/* Card count */}
                  <div>
                    <label className="text-xs text-mystic-rose/50 mb-2 block">
                      牌数：<span className="text-mystic-gold">{builderCardCount}</span> 张
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={builderCardCount}
                      onChange={(e) => updateBuilderCardCount(Number(e.target.value))}
                      className="w-full accent-mystic-gold"
                    />
                    <div className="flex justify-between text-[10px] text-mystic-rose/30 mt-1">
                      <span>1</span><span>3</span><span>6</span><span>9</span><span>12</span>
                    </div>
                  </div>

                  {/* Position labels */}
                  <div>
                    <label className="text-xs text-mystic-rose/50 mb-2 block">各牌位名称（可选，留空使用默认名）</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {builderPositionLabels.map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-mystic-rose/40 min-w-[2rem]">#{i + 1}</span>
                          <input
                            value={label}
                            onChange={(e) => {
                              const next = [...builderPositionLabels];
                              next[i] = e.target.value;
                              setBuilderPositionLabels(next);
                            }}
                            placeholder={`牌位 ${i + 1}`}
                            className="flex-1 bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-3 py-2 text-foreground/80 placeholder:text-mystic-rose/25 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create & Cancel buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreateCustom}
                      className="flex-1 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm"
                    >
                      创建牌阵
                    </button>
                    <button
                      onClick={() => setShowBuilder(false)}
                      className="px-6 py-3 rounded-full border border-mystic-rose/30 text-mystic-rose/50 hover:text-mystic-rose hover:border-mystic-rose/50 transition-all text-sm"
                    >
                      取消
                    </button>
                  </div>
                </motion.div>
              )}

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

                  <div ref={questionRef}>
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

              {/* Card grid — collapsible */}
              <div className="w-full">
                {/* Toggle bar */}
                <button
                  onClick={() => setCardsCollapsed(!cardsCollapsed)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs text-mystic-rose/40 hover:text-mystic-rose/70 transition-colors"
                >
                  {cardsCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      展开牌阵 · {cards.filter(c => c.flipped).length}/{cards.length} 张
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      收起牌阵
                    </>
                  )}
                </button>

                {/* Collapsed: compact horizontal strip */}
                {cardsCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-wrap gap-3 justify-center py-3"
                  >
                    {cards.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-mystic-purple/20 bg-mystic-dark/30 text-sm"
                      >
                        <span className="text-mystic-gold/60 font-cinzel text-xs min-w-[1rem]">{i + 1}.</span>
                        <span className="text-foreground/80">{c.card.nameCN}</span>
                        <span className={`text-xs ${c.isReversed ? "text-mystic-rose/60" : "text-mystic-gold/60"}`}>
                          {c.isReversed ? "逆" : "正"}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Expanded: full card grid */}
                {!cardsCollapsed && (
                  <div className="flex flex-wrap gap-6 justify-center py-4">
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
                )}
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
                  className="w-full max-w-xl flex flex-col items-center gap-4"
                >
                  {cards.filter(c => c.flipped).length > 0 && (
                    <CardInterpretation
                      card={cards[0].card}
                      isReversed={cards[0].isReversed}
                      question={question || undefined}
                      spreadType={spread!.name}
                      allCards={cards.map(c => c.card)}
                      allReversed={cards.map(c => c.isReversed)}
                      positions={cards.map(c => c.position)}
                      onAiText={setAiText}
                    />
                  )}
                  <ShareButton
                    cards={cards.map(c => c.card)}
                    isReversed={cards.map(c => c.isReversed)}
                    spreadType={spread!.name}
                    question={question || undefined}
                    interpretation={aiText}
                    standardInterpretation={(() => {
                      const dims = [
                        { key: "general", label: "🌟 综合解读" },
                        { key: "love", label: "💕 感情运势" },
                        { key: "career", label: "💼 事业学业" },
                        { key: "finance", label: "💰 财运分析" },
                        { key: "advice", label: "💡 行动建议" },
                      ] as const;
                      const dimEntries: Record<string, string[]> = {};
                      for (const d of dims) dimEntries[d.key] = [];
                      for (const c of cards) {
                        const interp = c.isReversed
                          ? c.card.interpretation.reversed
                          : c.card.interpretation.upright;
                        for (const d of dims) {
                          dimEntries[d.key].push(
                            `【${c.position}】${c.card.nameCN}（${c.isReversed ? "逆" : "正"}）：${interp[d.key]}`
                          );
                        }
                      }
                      return dims
                        .map((d) => d.label + "\n" + dimEntries[d.key].join("\n"))
                        .join("\n\n");
                    })()}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
