"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Brain, Heart, RefreshCw, LogIn } from "lucide-react";
import { MbtiAvatar } from "@/components/MbtiAvatar";
import { PersonalityTestModal } from "@/components/PersonalityTestModal";
import {
  getMbtiResult, getSmResult, hasMbtiResult, hasSmResult,
  type MbtiResult, type SmResult,
} from "@/lib/personality-tests";
import { isLoggedIn } from "@/lib/api-client";

export default function PersonalityPage() {
  const [activeTab, setActiveTab] = useState<"mbti" | "sm">("mbti");
  const [modalOpen, setModalOpen] = useState(false);
  const [mbtiResult, setMbtiResult] = useState<MbtiResult | null>(null);
  const [smResult, setSmResult] = useState<SmResult | null>(null);

  const refresh = () => {
    setMbtiResult(getMbtiResult());
    setSmResult(getSmResult());
  };

  useEffect(() => { refresh(); }, []);

  const handleComplete = () => {
    refresh();
  };

  const openTest = (type: "mbti" | "sm") => {
    setActiveTab(type);
    setModalOpen(true);
  };

  const loggedIn = isLoggedIn();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <h1 className="text-xl font-cinzel text-mystic-gold">性格探索</h1>
          <div className="w-[60px]" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mystic-purple/20 mb-6">
          <button
            onClick={() => setActiveTab("mbti")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
              activeTab === "mbti"
                ? "border-mystic-gold text-mystic-gold"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <Brain className="w-4 h-4" />
            MBTI 性格
          </button>
          <button
            onClick={() => setActiveTab("sm")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
              activeTab === "sm"
                ? "border-mystic-gold text-mystic-gold"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <Heart className="w-4 h-4" />
            BDSM 倾向
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "mbti" && (
            <MbtiPanel key="mbti" result={mbtiResult} onStart={() => openTest("mbti")} loggedIn={loggedIn} />
          )}
          {activeTab === "sm" && (
            <SmPanel key="sm" result={smResult} onStart={() => openTest("sm")} loggedIn={loggedIn} />
          )}
        </AnimatePresence>

        {/* Test modal */}
        <PersonalityTestModal
          open={modalOpen}
          testType={activeTab}
          onClose={() => setModalOpen(false)}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

/* ── Shared layout components ── */

const panelVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function AnimatePresence({ children, mode }: { children: React.ReactNode; mode?: "wait" }) {
  return children;
}

/* ── MBTI Panel ── */

function MbtiPanel({ result, onStart, loggedIn }: { result: MbtiResult | null; onStart: () => void; loggedIn: boolean }) {
  if (!result) {
    return (
      <motion.div {...panelVariants} className="glass-card p-8 flex flex-col items-center gap-4 text-center">
        <Brain className="w-12 h-12 text-mystic-gold/40" />
        <div>
          <h3 className="text-base font-cinzel text-mystic-gold mb-1">MBTI 性格测试</h3>
          <p className="text-xs text-text-tertiary">16 道题 · 约 4 分钟 · 发现你的性格类型</p>
        </div>
        {!loggedIn ? (
          <>
            <p className="text-[11px] text-mystic-rose/70">请先登录后再进行测试</p>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-sm hover:bg-mystic-gold/20 transition-all">
              <LogIn className="w-3.5 h-3.5" />
              登录 / 注册
            </Link>
          </>
        ) : (
          <button
            onClick={onStart}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold font-cinzel text-sm transition-all"
        >
          开始测试
        </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div {...panelVariants} className="space-y-4">
      {/* Main result card */}
      <div className="glass-card p-5 flex flex-col items-center gap-3">
        <MbtiAvatar
          mbtiType={result.type}
          illustration={result.illustration}
          group={result.group}
          accentColor={result.color}
          size="md"
        />

        <div className="text-center">
          <h2 className="text-2xl font-cinzel" style={{ color: result.color }}>{result.type}</h2>
          <p className="text-base text-mystic-gold font-cinzel mt-0.5">
            {result.typeName} · {result.group}
          </p>
        </div>

        <p className="text-xs text-text-primary text-center leading-relaxed max-w-sm">
          {result.summary}
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          {result.traits.map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full text-[10px] border" style={{ borderColor: result.color + "33", color: result.color }}>
              {t}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mystic-gold/30 text-mystic-gold/70 text-xs hover:bg-mystic-gold/10 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          重新测试
        </button>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 bg-green-500/5 border-green-400/15">
          <p className="text-[10px] text-green-400/60 mb-1">优势</p>
          <p className="text-[10px] text-text-primary leading-relaxed">{result.strengths}</p>
        </div>
        <div className="glass-card p-3 bg-red-500/5 border-red-400/15">
          <p className="text-[10px] text-red-400/60 mb-1">劣势</p>
          <p className="text-[10px] text-text-primary leading-relaxed">{result.weaknesses}</p>
        </div>
      </div>

      {/* Career */}
      <div className="glass-card p-4">
        <p className="text-[10px] text-mystic-rose/60 mb-1">适合领域</p>
        <p className="text-[11px] text-text-primary">{result.career}</p>
      </div>

      {/* Zodiac match */}
      <div className="glass-card p-4">
        <p className="text-xs text-mystic-gold/80 mb-2 font-cinzel">星座配对</p>
        <div className="flex flex-wrap gap-2">
          {result.zodiacMatch.map((z) => (
            <span key={z} className="px-3 py-1.5 rounded-full bg-mystic-gold/10 text-xs text-mystic-gold border border-mystic-gold/20">
              {z}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── S/M Panel ── */

function SmPanel({ result, onStart, loggedIn }: { result: SmResult | null; onStart: () => void; loggedIn: boolean }) {
  if (!result) {
    return (
      <motion.div {...panelVariants} className="glass-card p-8 flex flex-col items-center gap-4 text-center">
        <Heart className="w-12 h-12 text-mystic-gold/40" />
        <div>
          <h3 className="text-base font-cinzel text-mystic-gold mb-1">绳师48号倾向 · BDSM测评</h3>
          <p className="text-xs text-text-tertiary">12 道题 · 约 3 分钟 · 绳师48号经典版</p>
        </div>
        {!loggedIn ? (
          <>
            <p className="text-[11px] text-mystic-rose/70">请先登录后再进行测试</p>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-sm hover:bg-mystic-gold/20 transition-all">
              <LogIn className="w-3.5 h-3.5" />
              登录 / 注册
            </Link>
          </>
        ) : (
          <button
            onClick={onStart}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold font-cinzel text-sm transition-all"
          >
            开始测试
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div {...panelVariants} className="space-y-4">
      {/* Main result card */}
      <div className="glass-card p-5 flex flex-col items-center gap-3">
        <span className="text-4xl">{result.primaryType.icon}</span>
        <div className="text-center">
          <h2 className="text-lg font-cinzel" style={{ color: result.primaryType.color }}>
            {result.primaryType.type}
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {result.primaryType.en} · {result.primaryType.score}%
          </p>
        </div>

        <p className="text-xs text-text-primary text-center leading-relaxed max-w-sm">
          {result.summary}
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          {result.traits.map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-mystic-purple/10 border border-mystic-gold/15 text-[10px] text-mystic-gold">
              {t}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mystic-gold/30 text-mystic-gold/70 text-xs hover:bg-mystic-gold/10 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          重新测试
        </button>
      </div>

      {/* Hexagon radar chart */}
      <div className="glass-card p-4 flex flex-col items-center">
        <p className="text-xs text-mystic-gold/80 mb-2 font-cinzel self-start">六维度倾向雷达</p>
        <svg viewBox="0 0 200 200" className="w-44 h-44">
          {(() => {
            const R = 78, cx = 100, cy = 100;
            const axes = result.types;
            const pt = (i: number, val: number) => {
              const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
              const r = (val / 100) * R;
              return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
            };
            return (
              <>
                {[25, 50, 75, 100].map(pct => (
                  <polygon key={`r${pct}`} points={axes.map((_, i) => { const p = pt(i, pct); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
                ))}
                {axes.map((_, i) => { const p = pt(i, 100); return <line key={`a${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />; })}
                <polygon points={axes.map((t, i) => { const p = pt(i, t.score); return `${p.x},${p.y}`; }).join(" ")} fill="rgba(212,168,83,0.1)" stroke="rgba(212,168,83,0.35)" strokeWidth="1.2" />
                {axes.map((t, i) => { const p = pt(i, t.score); return <circle key={`d${i}`} cx={p.x} cy={p.y} r="2.5" fill={t.color} stroke="white" strokeWidth="0.5" />; })}
                {axes.map((t, i) => { const p = pt(i, 115); return <text key={`l${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="7">{t.type.slice(0,2)}</text>; })}
              </>
            );
          })()}
        </svg>
      </div>

      {/* 6-type bar chart */}
      <div className="glass-card p-4">
        <p className="text-xs text-mystic-gold/80 mb-3 font-cinzel">六种倾向分布</p>
        <div className="space-y-2.5">
          {result.types.map((t) => (
            <div key={t.en} className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">{t.icon}</span>
              <span className="text-[11px] w-14 text-text-secondary shrink-0">{t.type}</span>
              <div className="flex-1 h-4 bg-mystic-purple/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: t.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.score}%` }}
                  transition={{ duration: 0.8, delay: result.types.indexOf(t) * 0.08 }}
                />
              </div>
              <span className="text-[10px] w-8 text-right text-text-tertiary shrink-0">{t.score}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship tip */}
      <div className="glass-card p-4">
        <p className="text-xs text-mystic-gold/80 mb-2 font-cinzel">关系洞察</p>
        <p className="text-[11px] text-text-primary leading-relaxed">{result.relationshipTip}</p>
      </div>

      {/* Dirty Talk + Sweet Talk */}
      {(result.dirtyTalk || result.sweetTalk) && <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 bg-red-500/5 border-red-400/15">
          <p className="text-xs text-red-400/60 mb-2 font-cinzel">🔥 Dirty Talk</p>
          {result.dirtyTalk?.map((line: string, i: number) => (
            <p key={i} className="text-[10px] text-text-primary leading-relaxed mb-1 last:mb-0">
              "{line}"
            </p>
          ))}
        </div>
        <div className="glass-card p-4 bg-pink-500/5 border-pink-400/15">
          <p className="text-xs text-pink-400/60 mb-2 font-cinzel">💕 Sweet Talk</p>
          {result.sweetTalk?.map((line: string, i: number) => (
            <p key={i} className="text-[10px] text-text-primary leading-relaxed mb-1 last:mb-0">
              "{line}"
            </p>
          ))}
        </div>
      </div>}
    </motion.div>
  );
}
