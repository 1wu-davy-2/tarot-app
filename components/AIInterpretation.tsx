"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { getRemainingUses, consumeUse, getLimitMessage, isAdmin } from "@/lib/auth-utils";
import { LoginModal } from "@/components/LoginModal";
import { isLoggedIn, apiSaveReading } from "@/lib/api-client";

interface AIInterpretationProps {
  cards: import("@/lib/tarot-data").TarotCard[];
  isReversed: boolean[];
  spreadType: string;
  question?: string;
  onComplete?: () => void;
}

export function AIInterpretation({ cards, isReversed, spreadType, question, onComplete }: AIInterpretationProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingUses());
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  const startAiFlow = () => {
    const rem = getRemainingUses();
    setRemaining(rem);
    if (rem <= 0) {
      setBlocked(true);
      setLoading(false);
      return;
    }
    if (!consumeUse()) {
      setBlocked(true);
      setError(getLimitMessage());
      setLoading(false);
      return;
    }
    setRemaining(getRemainingUses());
    setBlocked(false);
    fetchInterpretation();
  };

  const fetchInterpretation = useCallback(async () => {
    setLoading(true);
    setText("");
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards, isReversed, question: question || "", spreadType }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get interpretation");
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
              setText((prev) => prev + parsed.content);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // skip unparseable
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "解读请求失败，请稍后重试");
      }
    } finally {
      setLoading(false);
      onComplete?.();
    }
  }, [cards, isReversed, spreadType, question, onComplete]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startAiFlow();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Save to backend when streaming completes (text exists and no longer loading)
  const savedRef = useRef(false);
  useEffect(() => {
    if (text && !loading && !savedRef.current && isLoggedIn()) {
      savedRef.current = true;
      apiSaveReading({
        question: question || "",
        ai_response: text,
        spread_type: spreadType,
        cards: cards.map((c, i) => ({
          nameCN: c.nameCN,
          imageUrl: c.imageUrl,
          isReversed: isReversed[i] ?? false,
          position: `牌位${i + 1}`,
        })),
      }).catch((err) => { console.error("[AIInterpretation] backend save failed:", err); });
    }
  }, [text, loading, cards, isReversed, spreadType, question]);

  // Blocked — not enough credits
  if (blocked && !text) {
    return (
      <div className="glass-card p-6 text-center">
        <h3 className="text-lg font-cinzel text-mystic-gold mb-4">🔮 AI 塔罗解读</h3>
        <p className="text-text-secondary text-sm mb-2">{error || getLimitMessage()}</p>
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/10 transition-all mt-4"
        >
          <Sparkles className="w-4 h-4" />
          <span>登录解锁更多次数</span>
        </button>
        <LoginModal
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setRemaining(getRemainingUses());
            setBlocked(false);
            setError("");
            startAiFlow();
          }}
        />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-cinzel text-mystic-gold mb-4 text-center">🔮 AI 塔罗解读</h3>

      {loading && !text && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-mystic-gold animate-spin" />
          <p className="text-text-secondary text-sm">正在连接宇宙智慧...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm mb-2">{error}</p>
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
          <div className="whitespace-pre-wrap text-cormorant leading-relaxed text-text-primary">
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
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) {
      return <h4 key={i} className="text-mystic-gold font-cinzel text-base mt-4 mb-2">{line.slice(4)}</h4>;
    }
    if (line.startsWith("## ")) {
      return <h3 key={i} className="text-mystic-gold font-cinzel text-lg mt-4 mb-2">{line.slice(3)}</h3>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={i} className="text-mystic-gold font-cinzel text-xl mt-4 mb-2">{line.slice(2)}</h2>;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} className="text-text-primary ml-4">{renderBold(line.slice(2))}</li>;
    }
    if (line.match(/^\d+\./)) {
      return <li key={i} className="text-text-primary ml-4 list-decimal">{renderBold(line.replace(/^\d+\.\s*/, ""))}</li>;
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
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
