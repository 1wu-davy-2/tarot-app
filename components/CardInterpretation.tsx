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
  onAiText?: (text: string) => void;
}

const dimensionLabels: Record<string, { label: string; icon: string }> = {
  general: { label: "综合解读", icon: "🌟" },
  love: { label: "感情运势", icon: "💕" },
  career: { label: "事业学业", icon: "💼" },
  finance: { label: "财运分析", icon: "💰" },
  advice: { label: "行动建议", icon: "💡" },
};

function StandardInterpretation({ card, isReversed }: { card: TarotCard; isReversed: boolean }) {
  const [openSection, setOpenSection] = useState<string>("general");
  const interp = isReversed ? card.interpretation.reversed : card.interpretation.upright;
  const keys = Object.keys(interp) as (keyof typeof interp)[];

  return (
    <div className="space-y-3">
      <p className="text-mystic-rose/50 text-xs mb-4 text-center">
        {isReversed ? "逆位 · Reversed" : "正位 · Upright"} —— 本地标准解读，无需联网
      </p>

      {keys.map((key) => {
        const dim = dimensionLabels[key];
        if (!dim) return null;
        const isOpen = openSection === key;

        return (
          <div key={key} className="border border-mystic-purple/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenSection(isOpen ? "" : key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-mystic-purple/10 transition-colors"
            >
              <span className="text-sm font-cinzel text-mystic-gold flex items-center gap-2">
                <span>{dim.icon}</span>
                {dim.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-mystic-rose/40 transition-transform duration-200 ${
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
                  <div className="px-4 pb-4 text-sm text-foreground/80 leading-relaxed border-t border-mystic-purple/10 pt-3">
                    {interp[key]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {card.symbolism && (
        <div className="mt-4 pt-4 border-t border-mystic-purple/20">
          <p className="text-xs text-mystic-rose/40 mb-1">牌面象征</p>
          <p className="text-xs text-foreground/50 italic">{card.symbolism}</p>
        </div>
      )}
    </div>
  );
}

function AIInterpretationTab({
  cards,
  isReversed,
  question,
  spreadType,
  onText,
}: {
  cards: TarotCard[];
  isReversed: boolean[];
  question?: string;
  spreadType?: string;
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
            <StandardInterpretation card={card} isReversed={isReversed} />
          ) : (
            <AIInterpretationTab
              cards={interpCards}
              isReversed={interpReversed}
              question={question}
              spreadType={spreadType}
              onText={onAiText}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
