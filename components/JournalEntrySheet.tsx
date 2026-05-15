"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import MoodSelector from "./MoodSelector";
import { type TarotCard } from "@/lib/tarot-data";
import { getCardImageUrl } from "@/lib/deck-themes";
import { getAstroEventsForDate, getMoonPhaseEmoji, ELECTIONAL_TEMPLATES, type AstroEvent } from "@/lib/astro-events";

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
  isFuture?: boolean;
  onDivination?: (question: string) => void;
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
  isFuture,
  onDivination,
}: JournalEntrySheetProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const h = () => setThemeTick((t) => t + 1);
    window.addEventListener("theme-change", h);
    return () => window.removeEventListener("theme-change", h);
  }, []);

  useEffect(() => {
    if (open) {
      setMood(entry?.mood ?? null);
      setNote(entry?.note ?? "");
      setShowDeleteConfirm(false);
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

          {/* Delete confirmation dialog */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-mystic-deep border border-red-500/20 rounded-2xl p-6 w-full max-w-xs text-center"
                >
                  <AlertTriangle className="w-8 h-8 text-red-400/80 mx-auto mb-3" />
                  <p className="text-sm text-text-primary mb-1">确定删除 {displayDate} 的日记吗？</p>
                  <p className="text-xs text-text-secondary mb-5">删除后无法恢复</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 rounded-full border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose text-sm transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => { onDelete?.(); setShowDeleteConfirm(false); }}
                      className="flex-1 py-2.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 text-sm transition-colors"
                    >
                      确认删除
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-t-3xl bg-mystic-deep border-t border-mystic-purple/30 flex flex-col ${isFuture ? "max-h-[82vh]" : "max-h-[60vh]"}`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-mystic-rose/20" />
            </div>

            {/* Header — fixed at top */}
            <div className="px-6 pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-cinzel text-mystic-gold">{displayDate}</h2>
                <div className="flex items-center gap-2">
                  {onDelete && entry?.id && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 rounded-full hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-mystic-purple/10 text-text-secondary hover:text-mystic-rose transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="px-6 overflow-y-auto flex-1">
              {/* Card preview — compact */}
              <div className="glass-card p-3 mb-3 flex items-center gap-3">
                <div className="w-10 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-mystic-dark/60 border border-mystic-purple/20">
                  <img
                    src={getCardImageUrl(card.imageUrl)}
                    alt={card.nameCN}
                    className={`w-full h-full object-cover ${isReversed ? "rotate-180" : ""}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-cinzel text-mystic-gold truncate">{card.nameCN}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {isReversed ? "逆位" : "正位"} · {card.element || card.suit}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                    {isReversed ? card.reversedMeaning : card.uprightMeaning}
                  </p>
                </div>
              </div>

              {/* Future date: Electional Divination */}
              {isFuture ? (
                <div className="space-y-3 pb-2">
                  <ElectionalInfo date={date} />

                  <div>
                    <p className="text-[10px] text-text-secondary mb-2 ml-1">择日占卜</p>
                    <div className="space-y-1.5">
                      {ELECTIONAL_TEMPLATES.map((t, j) => (
                        <button
                          key={j}
                          onClick={() => onDivination?.(t.question)}
                          className="w-full text-left p-2.5 rounded-xl bg-mystic-dark/60 border border-mystic-purple/15 hover:border-mystic-gold/30 transition-colors text-xs text-text-primary hover:text-text-primary flex items-center gap-2"
                        >
                          <Sparkles className="w-3 h-3 text-mystic-gold/60 flex-shrink-0" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-text-secondary mb-2 ml-1">或输入你的问题</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="这天适合..."
                        maxLength={100}
                        className="flex-1 bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                      />
                      <button
                        onClick={() => {
                          if (note.trim()) {
                            onDivination?.(note.trim());
                            setNote("");
                          }
                        }}
                        disabled={!note.trim()}
                        className="px-4 py-2 rounded-xl bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/30 transition-colors disabled:opacity-30 disabled:pointer-events-none text-sm"
                      >
                        占卜
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pb-2">
                  <p className="text-xs text-text-secondary mb-1 ml-1">今天的心情</p>
                  <MoodSelector value={mood} onChange={setMood} />

                  <div className="mt-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="记录一句话..."
                      maxLength={200}
                      rows={2}
                      className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-mystic-gold/40 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-text-tertiary text-right mt-1">
                      {note.length}/200
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky action button */}
            <div className="px-5 pb-4 pt-2 shrink-0">
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose text-white font-cinzel text-sm tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-mystic-gold/20"
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

// ── Electional info sub-component ──

function ElectionalInfo({ date }: { date: string }) {
  const events = getAstroEventsForDate(date);

  if (events.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center gap-3">
        <span className="text-xl">{getMoonPhaseEmoji(new Date(date + "T12:00:00"))}</span>
        <div>
          <p className="text-xs text-text-secondary">当日无特殊天象</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">可正常择日参考</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <p className="text-[10px] text-text-secondary mb-2">当日天象</p>
      <div className="space-y-2">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-lg">{ev.icon}</span>
            <div>
              <p className="text-sm text-text-primary">{ev.label}</p>
              <p className="text-[10px] text-text-tertiary">
                {ev.type === "new-moon" ? "适合开启新计划，设定意图" :
                 ev.type === "full-moon" ? "适合总结收尾，释放不再需要的事物" :
                 ev.type === "mercury-rx" ? "水逆期间，注意沟通细节，避免签约" :
                 ev.type === "venus-rx" ? "金逆期间，感情/财务决策需三思" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
