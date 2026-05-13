"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import MoodSelector from "./MoodSelector";
import { type TarotCard } from "@/lib/tarot-data";

interface JournalEntryData {
  id?: number;
  mood?: number;
  note?: string;
}

interface JournalEntrySheetProps {
  open: boolean;
  date: string;
  entry: JournalEntryData | null;
  card: TarotCard;
  isReversed: boolean;
  onSave: (data: { mood: number | null; note: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

export default function JournalEntrySheet({
  open,
  date,
  entry,
  card,
  isReversed,
  onSave,
  onDelete,
  onClose,
}: JournalEntrySheetProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setMood(entry?.mood ?? null);
      setNote(entry?.note ?? "");
    }
  }, [open, entry]);

  const handleSave = () => {
    onSave({ mood, note: note.trim() });
    onClose();
  };

  const parts = date.split("-");
  const displayDate = `${MONTH_NAMES[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}日`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-mystic-deep border-t border-mystic-purple/30"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-mystic-rose/20" />
            </div>

            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-cinzel text-mystic-gold">{displayDate}</h2>
                <div className="flex items-center gap-2">
                  {onDelete && entry?.id && (
                    <button
                      onClick={onDelete}
                      className="p-2 rounded-full hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-mystic-purple/10 text-mystic-rose/40 hover:text-mystic-rose transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Card preview */}
              <div className="glass-card p-4 mb-5 flex items-center gap-4">
                <div className="w-14 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-mystic-dark/60 border border-mystic-purple/20">
                  <img
                    src={card.imageUrl}
                    alt={card.nameCN}
                    className={`w-full h-full object-cover ${isReversed ? "rotate-180" : ""}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-cinzel text-mystic-gold">{card.nameCN}</p>
                  <p className="text-[10px] text-mystic-rose/40 mt-0.5">
                    {isReversed ? "逆位" : "正位"} · {card.element || card.suit}
                  </p>
                  <p className="text-[10px] text-foreground/50 mt-1 line-clamp-2">
                    {isReversed ? card.reversedMeaning : card.uprightMeaning}
                  </p>
                </div>
              </div>

              {/* Mood selector */}
              <p className="text-xs text-mystic-rose/40 mb-1 ml-1">今天的心情</p>
              <MoodSelector value={mood} onChange={setMood} />

              {/* Note */}
              <div className="mt-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="记录一句话..."
                  maxLength={200}
                  rows={3}
                  className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl p-4 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-mystic-gold/40 transition-colors resize-none"
                />
                <p className="text-[10px] text-mystic-rose/20 text-right mt-1">
                  {note.length}/200
                </p>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                className="w-full mt-5 py-3 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose text-white font-cinzel text-base tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-mystic-gold/20"
              >
                保存记录
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
