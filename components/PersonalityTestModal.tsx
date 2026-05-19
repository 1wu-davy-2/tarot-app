"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn } from "lucide-react";
import Link from "next/link";
import { MbtiAvatar } from "@/components/MbtiAvatar";
import {
  MBTI_QUESTIONS, MBTI_LIKERT_OPTIONS, SM_QUESTIONS, SM_LIKERT_OPTIONS,
  calcMbti, calcSm,
  saveMbtiResult, saveSmResult,
  getPersonalityPayload,
  type MbtiResult, type SmResult,
} from "@/lib/personality-tests";
import { apiSyncPersonality, apiGetSmTalks, isLoggedIn } from "@/lib/api-client";

interface Props {
  open: boolean;
  testType: "mbti" | "sm";
  onClose: () => void;
  onComplete?: () => void;
}

type Phase = "intro" | "quiz" | "result";

export function PersonalityTestModal({ open, testType, onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [mbtiAnswers, setMbtiAnswers] = useState<Map<string, number>>(new Map());
  const [smAnswers, setSmAnswers] = useState<Map<string, number>>(new Map());
  const [mbtiResult, setMbtiResult] = useState<MbtiResult | null>(null);
  const [smResult, setSmResult] = useState<SmResult | null>(null);
  const [selectedVal, setSelectedVal] = useState<string | number | null>(null);

  const questions = testType === "mbti" ? MBTI_QUESTIONS : SM_QUESTIONS;
  const totalQ = questions.length;
  const isLastQ = currentQ === totalQ - 1;

  const reset = useCallback(() => {
    setPhase("intro");
    setCurrentQ(0);
    setMbtiAnswers(new Map());
    setSmAnswers(new Map());
    setMbtiResult(null);
    setSmResult(null);
    setSelectedVal(null);
  }, []);

  const startQuiz = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setSelectedVal(null);
  };

  const handleAnswer = (val: string | number) => {
    setSelectedVal(val);
    // Auto-advance after brief delay
    setTimeout(() => {
      if (testType === "mbti") {
        const newAnswers = new Map(mbtiAnswers);
        newAnswers.set(MBTI_QUESTIONS[currentQ].id, val as number);
        setMbtiAnswers(newAnswers);
        if (isLastQ) {
          const result = calcMbti(newAnswers);
          setMbtiResult(result);
          saveMbtiResult(result);
          apiSyncPersonality(getPersonalityPayload());
          setPhase("result");
          onComplete?.();
        } else {
          setCurrentQ(currentQ + 1);
          setSelectedVal(null);
        }
      } else {
        const newAnswers = new Map(smAnswers);
        newAnswers.set(SM_QUESTIONS[currentQ].id, val as number);
        setSmAnswers(newAnswers);
        if (isLastQ) {
          const result = calcSm(newAnswers);
          setSmResult(result);
          saveSmResult(result);
          apiSyncPersonality(getPersonalityPayload());
          setPhase("result");
          onComplete?.();
        } else {
          setCurrentQ(currentQ + 1);
          setSelectedVal(null);
        }
      }
    }, 300);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const progress = ((currentQ + (selectedVal !== null ? 1 : 0)) / totalQ) * 100;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={phase !== "quiz" ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed z-50 flex flex-col max-w-md mx-auto rounded-2xl border border-mystic-gold/25 shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 6, 18, 0.97)",
              top: "6%",
              left: "max(12px, env(safe-area-inset-left, 12px))",
              right: "max(12px, env(safe-area-inset-right, 12px))",
              maxHeight: "88dvh",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/20 shrink-0">
              <div>
                <h2 className="text-xs font-cinzel text-mystic-gold">
                  {testType === "mbti" ? "MBTI 性格测试" : "BDSM 倾向测评"}
                </h2>
                {phase === "quiz" && (
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    第 {currentQ + 1}/{totalQ} 题
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-mystic-purple/20 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-4 flex-1" style={{ maxHeight: "calc(88dvh - 120px)" }}>
              {/* ── Phase: Intro ── */}
              {phase === "intro" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="text-4xl">{testType === "mbti" ? "🧠" : "💫"}</div>
                  <h3 className="text-lg font-cinzel text-mystic-gold text-center">
                    {testType === "mbti" ? "MBTI 性格类型测试" : "绳师48号倾向 · BDSM测评"}
                  </h3>
                  <p className="text-xs text-text-secondary text-center leading-relaxed">
                    {testType === "mbti"
                      ? "仅需 16 道题，约 4 分钟\n从四个维度探索你的性格密码，发现属于你的 16 型人格"
                      : "仅需 12 道题，约 3 分钟\n探索你在 6 种倾向类型中的分布，了解自己的关系模式"
                    }
                  </p>
                  {!isLoggedIn() ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <p className="text-[11px] text-mystic-rose/70 text-center">请先登录后再进行测试</p>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-sm hover:bg-mystic-gold/20 transition-all"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        登录 / 注册
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                        <span>⏱ {testType === "mbti" ? "~4 分钟" : "~3 分钟"}</span>
                        <span>📋 {totalQ} 题</span>
                        <span>🔒 结果同步云端</span>
                      </div>
                      <button
                        onClick={startQuiz}
                        className="mt-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold font-cinzel text-sm transition-all"
                      >
                        开始测试
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Phase: Quiz ── */}
              {phase === "quiz" && (
                <div className="flex flex-col gap-6 py-2">
                  {/* Progress bar */}
                  <div className="h-1 bg-mystic-purple/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-mystic-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Question */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQ}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <p className="text-sm text-text-primary leading-relaxed text-center">
                        {questions[currentQ].text}
                      </p>

                      {/* Options */}
                      <div className="space-y-2">
                        {testType === "mbti" && (() => {
                          const q = MBTI_QUESTIONS[currentQ];
                          return (
                            <>
                              {/* Pole labels */}
                              <div className="flex justify-between text-[10px] text-text-tertiary px-1">
                                <span>← {q.poleA}</span>
                                <span>{q.poleB} →</span>
                              </div>
                              {/* 5-point scale */}
                              <div className="flex gap-1">
                                {MBTI_LIKERT_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleAnswer(opt.value)}
                                    disabled={selectedVal !== null}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] transition-all border ${
                                      selectedVal === opt.value
                                        ? "bg-mystic-gold/20 border-mystic-gold/50 text-mystic-gold"
                                        : "bg-mystic-dark/30 border-mystic-purple/20 text-text-secondary hover:border-mystic-rose/30"
                                    }`}
                                  >
                                    <div className="text-xs">{opt.label}</div>
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                        {testType === "sm" && (
                          <div className="flex flex-col gap-1.5">
                            {SM_LIKERT_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleAnswer(opt.value)}
                                disabled={selectedVal !== null}
                                className={`w-full py-2.5 px-4 rounded-lg text-xs transition-all ${
                                  selectedVal === opt.value
                                    ? "bg-mystic-gold/20 border border-mystic-gold/50 text-mystic-gold"
                                    : "bg-mystic-dark/30 border border-mystic-purple/20 text-text-secondary hover:border-mystic-rose/30"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* ── Phase: Result ── */}
              {phase === "result" && (
                <div className="space-y-4 py-2">
                  {testType === "mbti" && mbtiResult && (
                    <MbtiResultView result={mbtiResult} />
                  )}
                  {testType === "sm" && smResult && (
                    <SmResultView result={smResult} />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-mystic-purple/20 shrink-0 text-center">
              {phase === "result" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { reset(); startQuiz(); }}
                    className="flex-1 py-2 rounded-full border border-mystic-gold/30 text-mystic-gold/70 hover:bg-mystic-gold/10 text-xs transition-all"
                  >
                    重新测试
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-xs hover:bg-mystic-gold/20 transition-all"
                  >
                    关闭
                  </button>
                </div>
              ) : phase === "quiz" ? (
                <p className="text-[10px] text-text-tertiary">
                  {testType === "mbti" ? "请选择最符合你的选项" : "请根据实际情况选择符合程度"}
                </p>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Option button for MBTI ── */

function OptionButton({
  label, desc, selected, onClick,
}: {
  label: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3.5 rounded-xl text-left transition-all border ${
        selected
          ? "bg-mystic-gold/15 border-mystic-gold/50"
          : "bg-mystic-dark/30 border-mystic-purple/20 hover:border-mystic-rose/30"
      }`}
    >
      <span className={`text-sm font-cinzel ${selected ? "text-mystic-gold" : "text-text-primary"}`}>
        {label}
      </span>
      <p className="text-[10px] text-text-tertiary mt-0.5">{desc}</p>
    </button>
  );
}

/* ── MBTI result view ── */

function MbtiResultView({ result }: { result: MbtiResult }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar */}
      <MbtiAvatar
        mbtiType={result.type}
        illustration={result.illustration}
        group={result.group}
        accentColor={result.color}
        size="md"
      />

      {/* Type name */}
      <div className="text-center">
        <h3 className="text-2xl font-cinzel" style={{ color: result.color }}>
          {result.type}
        </h3>
        <p className="text-base text-mystic-gold font-cinzel mt-0.5">
          {result.typeName} · <span className="text-xs text-text-tertiary">{result.group}</span>
        </p>
      </div>

      {/* Summary */}
      <p className="text-xs text-text-primary text-center leading-relaxed">{result.summary}</p>

      {/* Traits */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {result.traits.map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-full text-[10px] border" style={{ borderColor: result.color + "33", color: result.color }}>
            {t}
          </span>
        ))}
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-400/15">
          <p className="text-[10px] text-green-400/60 mb-1">优势</p>
          <p className="text-[10px] text-text-primary leading-relaxed">{result.strengths}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-400/15">
          <p className="text-[10px] text-red-400/60 mb-1">劣势</p>
          <p className="text-[10px] text-text-primary leading-relaxed">{result.weaknesses}</p>
        </div>
      </div>

      {/* Career */}
      <div className="w-full p-3 rounded-xl bg-mystic-purple/5 border border-mystic-purple/20">
        <p className="text-[10px] text-mystic-rose/60 mb-1">适合领域</p>
        <p className="text-[10px] text-text-primary">{result.career}</p>
      </div>

      {/* Zodiac match */}
      <div className="w-full p-3 rounded-xl bg-mystic-gold/5 border border-mystic-gold/15">
        <p className="text-[10px] text-mystic-gold/60 mb-1">星座配对</p>
        <div className="flex flex-wrap gap-1.5">
          {result.zodiacMatch.map((z) => (
            <span key={z} className="px-2.5 py-1 rounded-full bg-mystic-gold/10 text-[10px] text-mystic-gold border border-mystic-gold/20">
              {z}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hexagon radar chart ── */

function HexRadar({ types }: { types: { type: string; score: number; color: string }[] }) {
  const R = 80;
  const cx = 100, cy = 100;
  const axes = types; // 6 items

  // Compute point for given axis index and value (0-100)
  const point = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = (val / 100) * R;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };

  // Grid rings
  const rings = [25, 50, 75, 100];
  const ringPolys = rings.map(pct =>
    axes.map((_, i) => {
      const { x, y } = point(i, pct);
      return `${x},${y}`;
    }).join(" ")
  );

  // Data polygon
  const dataPts = axes.map((t, i) => point(i, t.score));
  const dataPoly = dataPts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {/* Grid */}
        {ringPolys.map((pts, j) => (
          <polygon
            key={`ring-${j}`}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.8"
          />
        ))}
        {/* Axis lines */}
        {axes.map((_, i) => {
          const { x, y } = point(i, 100);
          return (
            <line
              key={`axis-${i}`}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={dataPoly}
          fill="rgba(212,168,83,0.12)"
          stroke="rgba(212,168,83,0.4)"
          strokeWidth="1.2"
        />
        {/* Data dots */}
        {dataPts.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y} r="3"
            fill={axes[i].color}
            stroke="white"
            strokeWidth="0.5"
          />
        ))}
        {/* Labels */}
        {axes.map((t, i) => {
          const { x, y } = point(i, 115);
          return (
            <text
              key={`lbl-${i}`}
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8"
            >
              {t.type.slice(0, 2)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── S/M result view ── */

function SmResultView({ result }: { result: SmResult }) {
  const [dirtyTalk, setDirtyTalk] = useState<string[]>(result.dirtyTalk);
  const [sweetTalk, setSweetTalk] = useState<string[]>(result.sweetTalk);

  // Map 6-type English names to 4-type DB keys
  const apiTypeMap: Record<string, string> = {
    Dominant: "S型", Sadist: "S型",
    Submissive: "M型", Masochist: "M型",
    Switch: "Switch", Vanilla: "Vanilla",
  };
  const apiType = apiTypeMap[result.primaryType.en] || result.primaryType.en;

  // Fetch spicy phrases from DB API, with localStorage cache
  useEffect(() => {
    const cacheKey = "tarot_sm_talks_" + apiType;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.dirty_talk && parsed.dirty_talk.length) setDirtyTalk(parsed.dirty_talk);
        if (parsed.sweet_talk && parsed.sweet_talk.length) setSweetTalk(parsed.sweet_talk);
        return;
      }
    } catch { /* no cache */ }

    apiGetSmTalks(apiType).then((data) => {
      if (data && (data.dirty_talk && data.dirty_talk.length || data.sweet_talk && data.sweet_talk.length)) {
        if (data.dirty_talk && data.dirty_talk.length) setDirtyTalk(data.dirty_talk);
        if (data.sweet_talk && data.sweet_talk.length) setSweetTalk(data.sweet_talk);
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* quota */ }
      }
    });
  }, [apiType]);

  return (
    <div className="flex flex-col gap-4">
      {/* Primary type badge */}
      <div className="text-center">
        <span className="text-4xl">{result.primaryType.icon}</span>
        <h3 className="text-lg font-cinzel" style={{ color: result.primaryType.color }}>
          {result.primaryType.type}
        </h3>
        <p className="text-[10px] text-text-tertiary">
          {result.primaryType.en} · {result.primaryType.score}%
        </p>
      </div>

      {/* Summary */}
      <p className="text-xs text-text-primary text-center leading-relaxed">{result.summary}</p>

      {/* Hexagon radar chart */}
      <HexRadar types={result.types} />

      {/* 6-type bar chart */}
      <div className="space-y-2">
        {result.types.map((t) => (
          <div key={t.en} className="flex items-center gap-2">
            <span className="text-xs w-5 text-center shrink-0">{t.icon}</span>
            <span className="text-[10px] w-14 text-text-secondary shrink-0">{t.type}</span>
            <div className="flex-1 h-3 bg-mystic-purple/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: t.color }}
                initial={{ width: 0 }}
                animate={{ width: `${t.score}%` }}
                transition={{ duration: 0.8, delay: result.types.indexOf(t) * 0.1 }}
              />
            </div>
            <span className="text-[10px] w-9 text-right text-text-tertiary shrink-0">{t.score}%</span>
          </div>
        ))}
      </div>

      {/* Traits */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {result.traits.map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-full bg-mystic-purple/10 border border-mystic-gold/15 text-[10px] text-mystic-gold">
            {t}
          </span>
        ))}
      </div>

      {/* Relationship tip */}
      <div className="p-3 rounded-xl bg-mystic-rose/5 border border-mystic-rose/15">
        <p className="text-[10px] text-mystic-rose/60 mb-1">关系建议</p>
        <p className="text-[10px] text-text-primary leading-relaxed">{result.relationshipTip}</p>
      </div>

      {/* Dirty Talk + Sweet Talk */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-400/15">
          <p className="text-[10px] text-red-400/60 mb-1.5">🔥 Dirty Talk</p>
          {dirtyTalk.map((line, i) => (
            <p key={i} className="text-[10px] text-text-primary leading-relaxed mb-1 last:mb-0">
              &ldquo;{line}&rdquo;
            </p>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-400/15">
          <p className="text-[10px] text-pink-400/60 mb-1.5">💕 Sweet Talk</p>
          {sweetTalk.map((line, i) => (
            <p key={i} className="text-[10px] text-text-primary leading-relaxed mb-1 last:mb-0">
              &ldquo;{line}&rdquo;
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
