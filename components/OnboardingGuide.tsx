"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";

const STEPS = [
  {
    title: "命运之镜",
    desc: "融合东西方智慧的塔罗解读，AI 为你揭示牌面深意。",
  },
  {
    title: "每日指引",
    desc: "每天一张专属塔罗牌，获取当日的宇宙指引与能量提示。点击翻牌，感受命运的低语。",
  },
  {
    title: "牌阵占卜",
    desc: "选择三牌阵、凯尔特十字等多种经典牌阵，针对你的问题给出全面解读。",
  },
  {
    title: "AI 深度解读",
    desc: "抽牌后可请求 DeepSeek AI 进行深度解读。登录后每日签到可获取更多次数。",
  },
  {
    title: "个人中心",
    desc: "查看解读记录、每日签到获取额外次数、查看今日星座运势。",
  },
];

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("tarot_onboarded");
    if (!seen) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("tarot_onboarded", "1");
      setOpen(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("tarot_onboarded", "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#0f0a1a] border border-mystic-purple/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-10 p-1 text-text-tertiary hover:text-mystic-rose"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center pt-10 pb-6 px-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 mb-4">
                <Sparkles className="w-7 h-7 text-mystic-gold" />
              </div>
              <h3 className="text-xl font-cinzel text-mystic-gold mb-3">
                {STEPS[step].title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {STEPS[step].desc}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 pb-8">
              <button
                onClick={handleSkip}
                className="text-xs text-text-tertiary hover:text-text-primary"
              >
                跳过
              </button>

              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === step ? "bg-mystic-gold" : "bg-mystic-rose/20"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-mystic-gold/80 to-mystic-rose/60 text-white text-sm font-semibold hover:opacity-90"
              >
                {step < STEPS.length - 1 ? (
                  <>
                    下一步 <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  "开始探索"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
