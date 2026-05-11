"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, ChevronDown } from "lucide-react";
import type { TarotCard } from "@/lib/tarot-data";
import { getRemainingUses, consumeUse, getLimitMessage, isAdmin } from "@/lib/auth-utils";
import { LoginModal } from "@/components/LoginModal";

interface CardInterpretationProps {
  card: TarotCard;
  isReversed: boolean;
  question?: string;
  spreadType?: string;
  allCards?: TarotCard[];
  allReversed?: boolean[];
  positions?: string[];
  onAiText?: (text: string) => void;
}

const dimensionLabels: Record<string, { label: string; icon: string }> = {
  general: { label: "综合解读", icon: "🌟" },
  love: { label: "感情运势", icon: "💕" },
  career: { label: "事业学业", icon: "💼" },
  finance: { label: "财运分析", icon: "💰" },
  advice: { label: "行动建议", icon: "💡" },
};

interface CardEntry {
  card: TarotCard;
  isReversed: boolean;
  position: string;
}

function StandardInterpretation({
  card,
  isReversed,
  allCards,
  allReversed,
  positions,
}: {
  card: TarotCard;
  isReversed: boolean;
  allCards?: TarotCard[];
  allReversed?: boolean[];
  positions?: string[];
}) {
  const isMulti = allCards && allCards.length > 1;
  const entries: CardEntry[] = isMulti
    ? allCards.map((c, i) => ({
        card: c,
        isReversed: allReversed?.[i] ?? false,
        position: positions?.[i] ?? `牌位 ${i + 1}`,
      }))
    : [{ card, isReversed, position: "" }];

  return (
    <div className="space-y-4">
      <p className="text-mystic-rose/50 text-xs text-center">
        本地标准解读，无需联网
      </p>

      {isMulti ? (
        <MultiCardOverview entries={entries} />
      ) : (
        <SingleCardInterpretation
          entry={entries[0]}
          isMulti={false}
          defaultExpanded
        />
      )}
    </div>
  );
}

const overviewDimensionLabels: Record<string, { label: string; icon: string }> = {
  general: { label: "综合解读", icon: "🌟" },
  love: { label: "感情运势", icon: "💕" },
  career: { label: "事业学业", icon: "💼" },
  finance: { label: "财运分析", icon: "💰" },
  advice: { label: "行动建议", icon: "💡" },
};

function MultiCardOverview({ entries }: { entries: CardEntry[] }) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (idx: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const dims = Object.keys(overviewDimensionLabels) as (keyof typeof overviewDimensionLabels)[];

  return (
    <div className="space-y-4">
      {/* ── Combined overview by dimension ── */}
      <div className="border border-mystic-gold/20 rounded-lg p-4 bg-mystic-gold/5">
        <h4 className="text-sm font-cinzel text-mystic-gold mb-3 text-center">
          综合解读摘要
        </h4>
        <div className="space-y-4">
          {dims.map((dim) => {
            const meta = overviewDimensionLabels[dim];
            return (
              <div key={dim}>
                <h5 className="text-xs font-cinzel text-mystic-gold/80 mb-2 flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  {meta.label}
                </h5>
                <div className="space-y-2">
                  {entries.map((entry, i) => {
                    const interp = entry.isReversed
                      ? entry.card.interpretation.reversed
                      : entry.card.interpretation.upright;
                    return (
                      <div key={i} className="text-xs text-foreground/75 leading-relaxed pl-3 border-l-2 border-mystic-purple/20">
                        <span className="text-mystic-rose/60 font-cinzel text-[11px]">
                          【{entry.position}】{entry.card.nameCN}
                          <span className={entry.isReversed ? "text-mystic-rose/50" : "text-mystic-gold/50"}>
                            {entry.isReversed ? "逆" : "正"}
                          </span>
                          {' '}—
                        </span>
                        <span className="text-foreground/70"> {interp[dim as keyof typeof interp]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Per-card detail toggle ── */}
      {entries.map((entry, i) => (
        <div key={i} className="border border-mystic-purple/20 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCard(i)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-mystic-purple/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-mystic-gold/60 font-cinzel min-w-[3rem]">
                {entry.position}
              </span>
              <span className="text-sm font-cinzel text-mystic-gold truncate">{entry.card.nameCN}</span>
              <span className={`text-xs ${entry.isReversed ? "text-mystic-rose/60" : "text-mystic-gold/60"}`}>
                {entry.isReversed ? "逆" : "正"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-mystic-rose/40">
                {expandedCards.has(i) ? "收起" : "详细"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-mystic-rose/40 transition-transform duration-200 ${
                  expandedCards.has(i) ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {expandedCards.has(i) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-mystic-purple/10">
                  <SingleCardDetail entry={entry} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SingleCardDetail({ entry }: { entry: CardEntry }) {
  const [openSection, setOpenSection] = useState<string>("general");
  const interp = entry.isReversed ? entry.card.interpretation.reversed : entry.card.interpretation.upright;
  const keys = Object.keys(interp) as (keyof typeof interp)[];

  return (
    <div className="pt-3 space-y-2">
      <p className="text-[11px] text-foreground/50 italic">
        {entry.isReversed ? entry.card.reversedMeaning : entry.card.uprightMeaning}
      </p>
      {keys.map((key) => {
        const dim = dimensionLabels[key];
        if (!dim) return null;
        const isOpen = openSection === key;
        return (
          <div key={key} className="border border-mystic-purple/15 rounded-md overflow-hidden">
            <button
              onClick={() => setOpenSection(isOpen ? "" : key)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-mystic-purple/10 transition-colors"
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
      {entry.card.symbolism && (
        <div className="pt-2 border-t border-mystic-purple/15">
          <p className="text-[10px] text-mystic-rose/40 mb-0.5">象征</p>
          <p className="text-[10px] text-foreground/45 italic">{entry.card.symbolism}</p>
        </div>
      )}
    </div>
  );
}

function SingleCardInterpretation({
  entry,
  isMulti,
  defaultExpanded,
}: {
  entry: CardEntry;
  isMulti: boolean;
  defaultExpanded: boolean;
}) {
  const [openSection, setOpenSection] = useState<string>(defaultExpanded ? "general" : "");
  const interp = entry.isReversed ? entry.card.interpretation.reversed : entry.card.interpretation.upright;
  const keys = Object.keys(interp) as (keyof typeof interp)[];

  return (
    <div className="border border-mystic-purple/20 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-mystic-purple/10 flex items-center gap-3">
        {isMulti && (
          <span className="text-xs text-mystic-gold/60 font-cinzel min-w-[3rem]">
            {entry.position}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-cinzel text-mystic-gold">{entry.card.nameCN}</span>
          <span className={`ml-2 text-xs ${entry.isReversed ? "text-mystic-rose/60" : "text-mystic-gold/60"}`}>
            {entry.isReversed ? "逆" : "正"}
          </span>
        </div>
        <p className="text-[11px] text-foreground/50 italic truncate max-w-[50%]">
          {entry.isReversed ? entry.card.reversedMeaning : entry.card.uprightMeaning}
        </p>
      </div>

      <div className="px-3 pb-3 pt-1 space-y-2">
        {keys.map((key) => {
          const dim = dimensionLabels[key];
          if (!dim) return null;
          const isOpen = openSection === key;

          return (
            <div key={key} className="border border-mystic-purple/15 rounded-md overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? "" : key)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-mystic-purple/10 transition-colors"
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

        {entry.card.symbolism && (
          <div className="pt-2 border-t border-mystic-purple/15">
            <p className="text-[10px] text-mystic-rose/40 mb-0.5">象征</p>
            <p className="text-[10px] text-foreground/45 italic">{entry.card.symbolism}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AIInterpretationTab({
  cards,
  isReversed,
  question,
  spreadType,
  positions,
  onText,
}: {
  cards: TarotCard[];
  isReversed: boolean[];
  question?: string;
  spreadType?: string;
  positions?: string[];
  onText?: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingUses());

  const startAiFlow = () => {
    const rem = getRemainingUses();
    setRemaining(rem);
    if (rem <= 0) {
      setShowLogin(true);
      return;
    }
    if (!consumeUse()) {
      setError(getLimitMessage());
      return;
    }
    setRemaining(getRemainingUses());
    fetchInterpretation();
  };

  const fetchInterpretation = async () => {
    setStarted(true);
    setLoading(true);
    setText("");
    setError("");

    let accumulated = "";

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards,
          isReversed,
          question: question || "未说明具体问题，求问者心中默想",
          spreadType: spreadType || "自定义牌阵",
          positions: positions || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "AI 服务暂时不可用，您可查看标准解读作为参考");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
                accumulated += parsed.content;
                setText(accumulated);
                onText?.(accumulated);
              }
            if (parsed.error) setError(parsed.error);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("AI 服务暂时不可用，您可查看标准解读作为参考");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!started && (
        <div className="text-center py-6">
          <p className="text-foreground/60 text-sm mb-2">
            获取 DeepSeek AI 为你深度解读牌面，融合东西方智慧
          </p>
          <p className="text-mystic-rose/40 text-xs mb-4">
            {isAdmin() ? "管理员 · 无限制" : getLimitMessage()}
          </p>
          <button
            onClick={startAiFlow}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/10 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>开始 AI 解读</span>
          </button>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          setRemaining(getRemainingUses());
          setError("");
        }}
      />

      {started && loading && !text && !error && (
        <div className="flex flex-col items-center gap-3 py-8">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-mystic-gold border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-mystic-rose/60 text-sm">正在连接宇宙智慧...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-red-400/80 text-sm mb-3">{error}</p>
          <button
            onClick={fetchInterpretation}
            className="text-mystic-gold text-sm underline hover:text-mystic-rose transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {text && (
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-cormorant leading-relaxed text-foreground/90">
            {renderMarkdown(text)}
          </div>
          {loading && (
            <span className="inline-block w-2 h-4 bg-mystic-gold/60 animate-pulse ml-0.5" />
          )}
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h4 key={i} className="text-mystic-gold font-cinzel text-base mt-4 mb-2">{line.slice(4)}</h4>;
    if (line.startsWith("## ")) return <h3 key={i} className="text-mystic-gold font-cinzel text-lg mt-4 mb-2">{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="text-mystic-gold font-cinzel text-xl mt-4 mb-2">{line.slice(2)}</h2>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="text-foreground/80 ml-4">{renderBold(line.slice(2))}</li>;
    if (line.match(/^\d+\./)) return <li key={i} className="text-foreground/80 ml-4">{renderBold(line.replace(/^\d+\.\s*/, ""))}</li>;
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="mb-1">{renderBold(line)}</p>;
  });
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-mystic-gold font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function CardInterpretation({
  card,
  isReversed,
  question,
  spreadType,
  allCards,
  allReversed,
  positions,
  onAiText,
}: CardInterpretationProps) {
  const [tab, setTab] = useState<"standard" | "ai">("standard");
  const interpCards = allCards || [card];
  const interpReversed = allReversed || [isReversed];

  return (
    <div className="glass-card p-6">
      {/* Tab switcher */}
      <div className="flex border-b border-mystic-purple/20 mb-6">
        <button
          onClick={() => setTab("standard")}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
            tab === "standard"
              ? "border-mystic-gold text-mystic-gold"
              : "border-transparent text-foreground/40 hover:text-foreground/60"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          标准解读
        </button>
        <button
          onClick={() => setTab("ai")}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
            tab === "ai"
              ? "border-mystic-gold text-mystic-gold"
              : "border-transparent text-foreground/40 hover:text-foreground/60"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 深度解读
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {tab === "standard" ? (
            <StandardInterpretation
              card={card}
              isReversed={isReversed}
              allCards={allCards}
              allReversed={allReversed}
              positions={positions}
            />
          ) : (
            <AIInterpretationTab
              cards={interpCards}
              isReversed={interpReversed}
              question={question}
              spreadType={spreadType}
              positions={positions}
              onText={onAiText}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
