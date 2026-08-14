"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shuffle, Sparkles, Clock, Layers, ChevronDown, ChevronUp, Plus, X, Globe, Download, User, Users, Eye, EyeOff } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { TarotCard } from "@/components/TarotCard";
import { CardDrawAnimation } from "@/components/CardDrawAnimation";
import { CardInterpretation } from "@/components/CardInterpretation";
import { tarotCards, type TarotCard as TarotCardType } from "@/lib/tarot-data";
import { saveReading, updateReading } from "@/lib/reading-history";
import { isLoggedIn, apiSaveReading, apiPatchReading, apiGetSpreadTemplates, apiUploadSpreadTemplate, apiUseSpreadTemplate } from "@/lib/api-client";
import {
  SpreadLayoutPreview, LayoutSelector,
  SPREAD_LAYOUTS, LAYOUT_LABELS,
  type LayoutType, type LayoutNode, type PositionLabel,
} from "@/components/SpreadLayoutPreview";

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
  layoutType: LayoutType;
  layoutNodes: LayoutNode[];
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
  const [forOthers, setForOthers] = useState(false);
  const [cards, setCards] = useState<CardState[]>([]);
  const [phase, setPhase] = useState<"select-type" | "draw" | "revealing" | "interpreting">("select-type");
  const [flippedCount, setFlippedCount] = useState(0);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [showQuestionInfo, setShowQuestionInfo] = useState(true);
  const [aiText, setAiText] = useState("");
  const [layoutMode, setLayoutMode] = useState<"fan" | "grid">("fan");

  // Custom spread builder state
  const [customSpreads, setCustomSpreads] = useState<Record<string, CustomSpreadEntry>>({});
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState(1); // 1=info, 2=layout, 3=edit labels
  const [builderName, setBuilderName] = useState("");
  const [builderLayout, setBuilderLayout] = useState<LayoutType>("linear");
  const [builderNodes, setBuilderNodes] = useState<LayoutNode[]>([]);
  const [builderLabels, setBuilderLabels] = useState<PositionLabel[]>([]);
  const [editingNode, setEditingNode] = useState<number | null>(null);

  // Community templates
  const [communityTemplates, setCommunityTemplates] = useState<Array<{
    id: number; name: string; description: string; card_count: number;
    layout_json: string; icon: string; use_count: number; created_at: string;
  }>>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [activeTemplatesTab, setActiveTemplatesTab] = useState<"builtin" | "custom" | "community">("builtin");

  // Load custom spreads on mount
  useEffect(() => { setCustomSpreads(loadCustomSpreads()); }, []);

  const loadCommunityTemplates = async () => {
    setCommunityLoading(true);
    try {
      const data = await apiGetSpreadTemplates("popular");
      setCommunityTemplates(data || []);
    } catch {}
    setCommunityLoading(false);
  };

  // Init builder with layout
  const startBuilder = () => {
    setBuilderName("");
    setBuilderLayout("linear");
    setBuilderNodes([...SPREAD_LAYOUTS.linear]);
    setBuilderLabels([]);
    setBuilderStep(1);
    setEditingNode(null);
    setShowBuilder(true);
  };

  // When layout changes, update nodes
  const handleLayoutChange = (type: LayoutType) => {
    setBuilderLayout(type);
    const nodes = [...SPREAD_LAYOUTS[type]];
    setBuilderNodes(nodes);
    // Reset labels
    setBuilderLabels([]);
    setEditingNode(null);
  };

  // Open node editor
  const handleEditNode = (index: number) => {
    setEditingNode(index);
  };

  // Update label for a node
  const handleUpdateLabel = (index: number, label: PositionLabel) => {
    const newLabels = [...builderLabels];
    while (newLabels.length <= index) newLabels.push({ label: "", sublabel: "", desc: "" });
    newLabels[index] = label;
    setBuilderLabels(newLabels);
  };

  // Create a custom spread with layout data
  const handleCreateCustom = () => {
    const name = builderName.trim() || "自定义牌阵";
    const positions: PositionLabel[] = builderNodes.map((_, i) => ({
      label: builderLabels[i]?.label || `位置 ${i + 1}`,
      sublabel: builderLabels[i]?.sublabel || `Pos ${i + 1}`,
      desc: builderLabels[i]?.desc || `第 ${i + 1} 个牌位的能量状态`,
    }));

    const entry: CustomSpreadEntry = {
      name,
      subtitle: "Custom Spread",
      description: `${builderNodes.length}张牌的自定义牌阵`,
      icon: "✨",
      cardCount: builderNodes.length,
      difficulty: "自定义",
      time: `${builderNodes.length * 2}分钟`,
      bestFor: "自由探索",
      positions,
      layoutType: builderLayout,
      layoutNodes: builderNodes,
    };

    const id = `custom-${Date.now()}`;
    const updated = { ...customSpreads, [id]: entry };
    setCustomSpreads(updated);
    saveCustomSpreads(updated);
    setSpreadType(id as SpreadType);
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

  // Refs to capture latest values for the backend-save effect without stale closures
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const questionRef2 = useRef(question);
  questionRef2.current = question;
  const spreadTypeRef2 = useRef(spreadType);
  spreadTypeRef2.current = spreadType;
  const allSpreadsRef2 = useRef(allSpreads);
  allSpreadsRef2.current = allSpreads;
  const aiTextRef = useRef(aiText);
  aiTextRef.current = aiText;

  // Conversation tracking for follow-up persistence
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const backendRecordId = useRef<number | null>(null);

  const backendSaved = useRef(false);
  const backendSaving = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingSave = useRef<(() => void) | null>(null);
  const saveRetries = useRef(0);
  const MAX_SAVE_RETRIES = 3;

  const doSave = useCallback(async () => {
    if (backendSaved.current || backendSaving.current) return;
    backendSaving.current = true;
    pendingSave.current = null;
    try {
      const curCards = cardsRef.current;
      const curQuestion = questionRef2.current;
      const curSpreadType = spreadTypeRef2.current;
      const curAllSpreads = allSpreadsRef2.current;
      const curAiText = aiTextRef.current;
      if (curCards.length === 0) return; // Only save if cards exist
      // If conversation has follow-ups, store as JSON array; otherwise plain text (or empty string)
      const convo = conversationRef.current;
      const aiPayload = convo.length > 2 ? JSON.stringify(convo) : (curAiText || "");
      const result = await apiSaveReading({
        question: curQuestion || "",
        ai_response: aiPayload,
        spread_type: (curSpreadType && curAllSpreads[curSpreadType]?.name) || "自定义牌阵",
        cards: curCards.map((c) => ({
          nameCN: c.card.nameCN,
          imageUrl: c.card.imageUrl,
          isReversed: c.isReversed,
          position: c.position,
        })),
      });
      backendSaved.current = true;
      backendRecordId.current = result?.id ?? null;
      saveRetries.current = 0;
    } catch (err) {
      console.error("[spread] backend save failed:", err);
      backendSaving.current = false;
      saveRetries.current += 1;
      if (saveRetries.current <= MAX_SAVE_RETRIES) {
        saveTimer.current = setTimeout(doSave, 3000 * saveRetries.current);
      }
    }
  }, []);

  // Patch existing record with updated conversation (after follow-ups)
  const doPatchSave = useCallback(async () => {
    const recordId = backendRecordId.current;
    if (!recordId || !isLoggedIn()) return;
    const convo = conversationRef.current;
    if (convo.length <= 2) return; // No follow-ups yet
    try {
      await apiPatchReading(recordId, { ai_response: JSON.stringify(convo) });
    } catch (err) {
      console.error("[spread] backend patch failed:", err);
    }
  }, []);

  // Called by CardInterpretation whenever the conversation changes (first reply + follow-ups)
  const handleConversationUpdate = useCallback((messages: { role: string; content: string }[]) => {
    conversationRef.current = messages;
    // Flatten for localStorage. The first user message is the original question,
    // which the history card already shows separately — skip it and only inline follow-ups.
    let seenFirstQuestion = false;
    const fullText = messages
      .map((m) => {
        if (m.role !== "user") return m.content;
        if (!seenFirstQuestion) { seenFirstQuestion = true; return null; }
        return `【追问】${m.content}`;
      })
      .filter((s): s is string => s !== null)
      .join("\n\n");
    setAiText(fullText);

    // If already saved to backend and this is a follow-up, PATCH
    if (backendSaved.current && backendRecordId.current && messages.length > 2) {
      doPatchSave();
    }
  }, [doPatchSave]);

  // Flush pending backend save on unmount or page hide (use sendBeacon for reliability)
  useEffect(() => {
    const flush = () => {
      if (backendSaved.current || backendSaving.current) return;
      backendSaving.current = true;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      const token = typeof window !== "undefined" ? localStorage.getItem("tarot_token") : null;
      if (!token) return;
      const curCards = cardsRef.current;
      const curQuestion = questionRef2.current;
      const curSpreadType = spreadTypeRef2.current;
      const curAllSpreads = allSpreadsRef2.current;
      const curAiText = aiTextRef.current;
      if (curCards.length === 0) return; // Only save if cards exist
      const convo = conversationRef.current;
      const aiPayload = convo.length > 2 ? JSON.stringify(convo) : curAiText;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      fetch(`${API_BASE}/api/readings`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: curQuestion || "",
          ai_response: aiPayload,
          spread_type: (curSpreadType && curAllSpreads[curSpreadType]?.name) || "自定义牌阵",
          cards: curCards.map((c) => ({
            nameCN: c.card.nameCN,
            imageUrl: c.card.imageUrl,
            isReversed: c.isReversed,
            position: c.position,
          })),
        }),
      }).catch(() => {});
    };
    const onVisibility = () => { if (document.hidden) flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  // Auto-save to backend when all cards flipped (regardless of AI interpretation)
  useEffect(() => {
    if (phase === "interpreting" && cards.length > 0) {
      if (isLoggedIn() && !backendSaved.current && !backendSaving.current) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        pendingSave.current = doSave;
        saveTimer.current = setTimeout(doSave, 1500);
      }
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [phase, cards.length, doSave]);

  // Update local storage when AI text changes
  useEffect(() => {
    if (aiText && spreadSaved.current && spreadId.current) {
      updateReading(spreadId.current, { aiInterpretation: aiText });
    }
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
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-mystic-rose/75 hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-cinzel text-mystic-gold text-glow">牌阵占卜</h1>
          <div className="w-[60px]" />
        </div>

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
              <p className="text-mystic-rose/55 text-xs text-center">选择牌阵，聆听命运的指引</p>

              {/* Spread selection */}
              {!showBuilder && (
                <div className="w-full max-w-2xl flex flex-col gap-8">
                  {/* ── Template tabs ── */}
                  <div className="flex border-b border-mystic-purple/20">
                    {([
                      ["builtin", "基础牌阵"],
                      ["custom", "我的模板"],
                      ["community", "🌐 社区"],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveTemplatesTab(key);
                          setSpreadType(null);
                          if (key === "community") loadCommunityTemplates();
                        }}
                        className={`flex-1 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
                          activeTemplatesTab === key
                            ? "border-mystic-gold text-mystic-gold"
                            : "border-transparent text-foreground/55 hover:text-foreground/75"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Builtin tab ── */}
                  {activeTemplatesTab === "builtin" ? (<div>
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
                          <p className="text-foreground/55 text-xs mb-3">{s.subtitle}</p>
                          <p className="text-foreground/75 text-sm mb-3">{s.description}</p>
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
                        className={`w-4 h-4 text-mystic-rose/55 transition-transform duration-300 ${
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
                                      <span className="text-[10px] text-mystic-rose/55">{s.cardCount}张</span>
                                      <span className="text-[10px] text-mystic-rose/45">{s.difficulty}</span>
                                    </div>
                                  </div>
                                  {spreadType === key && (
                                    <div className="w-2 h-2 rounded-full bg-mystic-gold animate-pulse shrink-0 ml-auto" />
                                  )}
                                </motion.button>
                              );
                            })}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  </div>) : null}

                  {/* ── Custom templates tab ── */}
                  {activeTemplatesTab === "custom" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {customKeys.map((key) => {
                          const s = customSpreads[key];
                          const isSelected = spreadType === key;
                          return (
                            <motion.button
                              key={key}
                              onClick={() => setSpreadType(key as SpreadType)}
                              className={`glass-card p-4 text-left transition-all group ${
                                isSelected ? "border-mystic-gold/60" : "hover:border-mystic-gold/30"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{s.icon}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCustom(key); }}
                                  className="text-mystic-rose/35 hover:text-mystic-rose/75"
                                ><X className="w-3.5 h-3.5" /></button>
                              </div>
                              <p className="text-sm font-cinzel text-mystic-gold/90">{s.name}</p>
                              <p className="text-[10px] text-mystic-rose/55 mt-1">{s.cardCount}张 · {s.layoutType ? LAYOUT_LABELS[s.layoutType]?.name : "线性"}</p>
                            </motion.button>
                          );
                        })}
                        {/* Create new */}
                        <motion.button
                          onClick={startBuilder}
                          className="glass-card p-4 flex flex-col items-center justify-center gap-2 border-dashed border-mystic-rose/20 hover:border-mystic-rose/50 transition-all min-h-[100px]"
                        >
                          <Plus className="w-6 h-6 text-mystic-rose/45" />
                          <span className="text-xs text-mystic-rose/55">创建新牌阵</span>
                        </motion.button>
                      </div>
                      {customKeys.length === 0 && (
                        <p className="text-center text-xs text-mystic-rose/55 py-8">暂无自定义牌阵，点击上方创建</p>
                      )}
                    </div>
                  )}

                  {/* ── Community tab ── */}
                  {activeTemplatesTab === "community" && (
                    <div className="space-y-4">
                      {communityLoading ? (
                        <div className="flex justify-center py-8">
                          <motion.div className="w-6 h-6 rounded-full border-2 border-mystic-gold border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                        </div>
                      ) : communityTemplates.length === 0 ? (
                        <p className="text-center text-xs text-mystic-rose/55 py-8">暂无社区模板</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {communityTemplates.map((t) => (
                            <motion.div
                              key={t.id}
                              className="glass-card p-4 flex flex-col gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{t.icon}</span>
                                <span className="text-sm font-cinzel text-mystic-gold/90 truncate">{t.name}</span>
                              </div>
                              <p className="text-[10px] text-mystic-rose/55">{t.card_count}张 · {t.description}</p>
                              <p className="text-[10px] text-mystic-rose/45">⬇ {t.use_count} 次使用</p>
                              <button
                                onClick={async () => {
                                  try {
                                    const layout = JSON.parse(t.layout_json);
                                    const entry: CustomSpreadEntry = {
                                      name: t.name,
                                      subtitle: "Community",
                                      description: t.description,
                                      icon: t.icon,
                                      cardCount: t.card_count,
                                      difficulty: "自定义",
                                      time: `${t.card_count * 2}分钟`,
                                      bestFor: "社区模板",
                                      positions: layout.positions || layout.nodes?.map((_: any, i: number) => ({ label: `位置${i + 1}`, sublabel: `Pos${i+1}`, desc: "" })) || [],
                                      layoutType: layout.type || "linear",
                                      layoutNodes: layout.nodes || [],
                                    };
                                    const id = `custom-${Date.now()}`;
                                    const updated = { ...customSpreads, [id]: entry };
                                    setCustomSpreads(updated);
                                    saveCustomSpreads(updated);
                                    apiUseSpreadTemplate(t.id).catch(() => {});
                                    setActiveTemplatesTab("custom");
                                    setSpreadType(id as SpreadType);
                                  } catch {}
                                }}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-mystic-gold/20 text-mystic-gold/70 text-xs hover:bg-mystic-gold/10 transition-all mt-auto"
                              >
                                <Download className="w-3 h-3" />
                                导入
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Custom spread builder */}
              {showBuilder && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 w-full max-w-lg flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-cinzel text-mystic-gold">
                      创建自定义牌阵 · 步骤 {builderStep}/3
                    </h3>
                    <button onClick={() => setShowBuilder(false)} className="text-mystic-rose/55 hover:text-mystic-rose">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step 1: Name + Description */}
                  {builderStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-mystic-rose/65 mb-1.5 block">牌阵名称</label>
                        <input
                          value={builderName}
                          onChange={(e) => setBuilderName(e.target.value)}
                          placeholder="给你的牌阵取个名字"
                          className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/45 text-sm focus:outline-none focus:border-mystic-gold/50"
                        />
                      </div>
                      <LayoutSelector selected={builderLayout} onSelect={handleLayoutChange} />
                      <button
                        onClick={() => setBuilderStep(2)}
                        className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm"
                      >
                        下一步：预览布局
                      </button>
                    </div>
                  )}

                  {/* Step 2: Layout Preview + Node Editing */}
                  {builderStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-mystic-rose/55 text-center">点击节点编辑牌位名称</p>
                      <SpreadLayoutPreview
                        layoutType={builderLayout}
                        nodes={builderNodes}
                        labels={builderLabels}
                        editingNode={editingNode}
                        onEditNode={handleEditNode}
                        onUpdateLabel={handleUpdateLabel}
                      />
                      {/* Node editing panel */}
                      {editingNode !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-mystic-gold/20 rounded-xl p-4 bg-mystic-gold/5"
                        >
                          <p className="text-xs text-mystic-gold/80 mb-3 font-cinzel">
                            编辑牌位 #{editingNode + 1}
                          </p>
                          <input
                            value={builderLabels[editingNode]?.label || ""}
                            onChange={(e) => handleUpdateLabel(editingNode, {
                              label: e.target.value,
                              sublabel: builderLabels[editingNode]?.sublabel || `Pos ${editingNode + 1}`,
                              desc: builderLabels[editingNode]?.desc || "",
                            })}
                            placeholder="位置名称，如：过去"
                            className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/45 text-sm focus:outline-none focus:border-mystic-gold/50 mb-2"
                          />
                          <input
                            value={builderLabels[editingNode]?.desc || ""}
                            onChange={(e) => handleUpdateLabel(editingNode, {
                              label: builderLabels[editingNode]?.label || "",
                              sublabel: builderLabels[editingNode]?.sublabel || `Pos ${editingNode + 1}`,
                              desc: e.target.value,
                            })}
                            placeholder="含义描述，如：过去对当下的影响"
                            className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-2.5 text-foreground/80 placeholder:text-mystic-rose/45 text-xs focus:outline-none focus:border-mystic-gold/50"
                          />
                          <button
                            onClick={() => setEditingNode(null)}
                            className="mt-2 text-xs text-mystic-gold/70 hover:text-mystic-gold"
                          >
                            完成编辑
                          </button>
                        </motion.div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => setBuilderStep(1)} className="px-6 py-3 rounded-full border border-mystic-rose/30 text-mystic-rose/65 hover:text-mystic-rose text-sm">
                          上一步
                        </button>
                        <button onClick={() => setBuilderStep(3)} className="flex-1 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/40 text-mystic-gold hover:border-mystic-gold text-sm">
                          下一步：保存
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Confirm + Save */}
                  {builderStep === 3 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-mystic-gold font-cinzel">{builderName || "自定义牌阵"}</p>
                        <p className="text-xs text-mystic-rose/55 mt-1">
                          {builderNodes.length} 张牌 · {LAYOUT_LABELS[builderLayout]?.name}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {builderNodes.map((_, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
                            <span className="text-mystic-gold min-w-[1.5rem]">#{i + 1}</span>
                            <span>{builderLabels[i]?.label || `位置 ${i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setBuilderStep(2)} className="px-6 py-3 rounded-full border border-mystic-rose/30 text-mystic-rose/65 text-sm">
                          上一步
                        </button>
                        <button onClick={handleCreateCustom} className="flex-1 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold font-cinzel text-sm">
                          保存牌阵
                        </button>
                      </div>
                    </div>
                  )}
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
                          <span className="text-foreground/55">{pos.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div ref={questionRef}>
                    {/* Self / Others toggle */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-mystic-rose/65">求问对象</span>
                      <div className="flex rounded-full bg-mystic-dark/60 border border-mystic-purple/30 p-0.5">
                        <button
                          onClick={() => setForOthers(false)}
                          className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                            !forOthers
                              ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          自己
                        </button>
                        <button
                          onClick={() => setForOthers(true)}
                          className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                            forOthers
                              ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          帮助别人
                        </button>
                      </div>
                    </div>
                    <label className="text-xs text-mystic-rose/65 mb-2 block">
                      {forOthers ? "对方的问题（可选）" : "你的问题（可选）"}
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={forOthers ? "描述对方的情况或问题..." : "你可以在心中默想，或者写下来..."}
                      rows={3}
                      className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/45 text-sm resize-none focus:outline-none focus:border-mystic-gold/50 transition-colors"
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
                    onClick={() => { setSpreadType(null); setForOthers(false); }}
                    className="text-mystic-rose/55 text-xs hover:text-mystic-rose transition-colors text-center"
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
              <div className="text-center mb-2 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-cinzel text-mystic-gold">
                  {spread!.name} — 抽牌仪式
                </h2>
                <p className="text-mystic-rose/55 text-xs mt-0.5 sm:mt-1">
                  跟随直觉，选择 {spread!.cardCount} 张呼唤你的牌
                </p>
                {/* Layout toggle */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setLayoutMode("fan")}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      layoutMode === "fan"
                        ? "bg-mystic-gold/15 border border-mystic-gold/40 text-mystic-gold"
                        : "border border-mystic-purple/20 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    扇形
                  </button>
                  <button
                    onClick={() => setLayoutMode("grid")}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      layoutMode === "grid"
                        ? "bg-mystic-gold/15 border border-mystic-gold/40 text-mystic-gold"
                        : "border border-mystic-purple/20 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    平铺
                  </button>
                </div>
              </div>
              <CardDrawAnimation
                cards={tarotCards}
                count={spread!.cardCount}
                onComplete={handleDrawComplete}
                layoutMode={layoutMode}
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
                <p className="text-mystic-rose/55 text-xs mt-1">
                  已翻开 {flippedCount}/{cards.length} 张
                </p>
              </div>

              {/* Question context — collapsible */}
              {(question || forOthers) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md mx-auto"
                >
                  <button
                    onClick={() => setShowQuestionInfo(!showQuestionInfo)}
                    className="flex items-center justify-center gap-2 w-full py-1.5 text-xs text-mystic-rose/55 hover:text-mystic-rose/75 transition-colors"
                  >
                    {showQuestionInfo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showQuestionInfo ? "隐藏问题" : "显示问题"}
                  </button>
                  <AnimatePresence>
                    {showQuestionInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            {forOthers ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mystic-purple/25 border border-mystic-purple/30 text-mystic-rose/80">
                                <Users className="w-3.5 h-3.5" />
                                帮助别人
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mystic-gold/10 border border-mystic-gold/25 text-mystic-gold/80">
                                <User className="w-3.5 h-3.5" />
                                为自己
                              </span>
                            )}
                          </div>
                          {question && (
                            <p className="text-sm text-foreground/70 leading-relaxed pl-1">
                              「{question}」
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Card grid — collapsible */}
              <div className="w-full">
                {/* Toggle bar */}
                <button
                  onClick={() => setCardsCollapsed(!cardsCollapsed)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs text-mystic-rose/55 hover:text-mystic-rose/70 transition-colors"
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
                        <span className={`text-xs ${c.isReversed ? "text-mystic-rose/75" : "text-mystic-gold/60"}`}>
                          {c.isReversed ? "逆" : "正"}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Expanded: full card grid */}
                {!cardsCollapsed && spread && (
                  <SpreadCardGrid
                    cards={cards}
                    spread={spread}
                    onFlipCard={handleFlipCard}
                  />
                )}
              </div>

              {phase === "revealing" && flippedCount > 0 && flippedCount < cards.length && (
                <button onClick={handleFlipAll} className="text-mystic-rose/55 text-xs hover:text-mystic-rose transition-colors">
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
                      onConversationUpdate={handleConversationUpdate}
                      autoStart={true}
                      forOthers={forOthers}
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

// ── Layout-based card grid for custom/non-Celtic spreads ──

function SpreadCardGrid({
  cards,
  spread,
  onFlipCard,
}: {
  cards: CardState[];
  spread: SpreadEntry | CustomSpreadEntry;
  onFlipCard: (i: number) => void;
}) {
  // Determine layout type
  const isCustom = "layoutType" in spread;
  const layoutType: LayoutType = (isCustom && spread.layoutType) ? spread.layoutType : "linear";
  const nodes: LayoutNode[] = (isCustom && spread.layoutNodes?.length === cards.length)
    ? spread.layoutNodes
    : cards.map((_, i) => ({ x: 50, y: 5 + (i * (90 / (cards.length - 1 || 1))) })); // fallback: vertical

  const useLayout = layoutType !== "linear" && nodes.length === cards.length;

  if (!useLayout) {
    // Simple flex-wrap grid (existing behavior)
    return (
      <div className="flex flex-wrap gap-6 justify-center py-4">
        {cards.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <TarotCard
              card={c.card}
              isReversed={c.isReversed}
              isFlipped={c.flipped}
              onClick={() => onFlipCard(i)}
              size="md"
            />
            <span className="text-xs text-mystic-rose/65 font-cinzel tracking-wider">{c.position}</span>
            {c.flipped && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-cinzel text-mystic-gold">
                {c.card.nameCN}
                <span className="text-mystic-rose/75 text-xs ml-1">{c.isReversed ? "逆" : "正"}</span>
              </motion.span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Layout-based absolute positioning
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ paddingBottom: "90%" }}>
      <div className="absolute inset-0">
        {cards.map((c, i) => {
          const node = nodes[i];
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-1.5"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <TarotCard
                card={c.card}
                isReversed={c.isReversed}
                isFlipped={c.flipped}
                onClick={() => onFlipCard(i)}
                size="sm"
              />
              <span className="text-[10px] text-mystic-rose/65 font-cinzel tracking-wider text-center leading-tight">
                {c.position}
              </span>
              {c.flipped && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-cinzel text-mystic-gold text-center leading-tight"
                >
                  {c.card.nameCN}
                  <span className="text-mystic-rose/75 ml-0.5">{c.isReversed ? "逆" : "正"}</span>
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
