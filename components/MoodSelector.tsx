"use client";

import { motion } from "framer-motion";

const MOODS = [
  { value: 1, emoji: "😊", label: "开心" },
  { value: 2, emoji: "😔", label: "难过" },
  { value: 3, emoji: "😡", label: "生气" },
  { value: 4, emoji: "😰", label: "焦虑" },
  { value: 5, emoji: "🤔", label: "思考" },
];

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number | null) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {MOODS.map((m) => {
        const selected = value === m.value;
        return (
          <motion.button
            key={m.value}
            type="button"
            onClick={() => onChange(selected ? null : m.value)}
            whileTap={{ scale: 1.3 }}
            animate={{ scale: selected ? 1.15 : 0.75 }}
            className={`relative flex flex-col items-center gap-1.5 transition-colors`}
          >
            <span
              className={`text-3xl transition-all duration-300 ${
                selected
                  ? "drop-shadow-[0_0_12px_rgba(212,168,83,0.5)]"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              {m.emoji}
            </span>
            <span
              className={`text-[10px] transition-colors ${
                selected ? "text-mystic-gold" : "text-foreground/35"
              }`}
            >
              {m.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
