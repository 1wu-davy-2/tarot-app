"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkAchievements, type AchievementEvent, type Achievement } from "@/lib/achievements";

interface ToastItem {
  id: string;
  achievement: Achievement;
}

export function useAchievementChecker() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const runCheck = useCallback(() => {
    const events = checkAchievements();
    if (events.length > 0) {
      setToasts((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        const newToasts = events
          .filter((e) => e.isNew && !existing.has(e.achievement.id))
          .map((e) => ({ id: e.achievement.id, achievement: e.achievement }));
        return [...prev, ...newToasts];
      });
    }
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, runCheck, dismiss };
}

export function AchievementToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onAnimationComplete={() => {
              setTimeout(() => onDismiss(t.id), 3000);
            }}
            className="bg-[#0f0a1a]/95 backdrop-blur-xl border border-mystic-gold/40 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 cursor-default"
          >
            <motion.span
              className="text-2xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5 }}
            >
              {t.achievement.icon}
            </motion.span>
            <div>
              <p className="text-xs text-mystic-gold/70">🏆 成就解锁！</p>
              <p className="text-sm font-cinzel text-mystic-gold">{t.achievement.title}</p>
              <p className="text-[10px] text-text-secondary">{t.achievement.description}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
