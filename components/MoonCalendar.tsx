"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getMoonPhase, getMoonPhaseEmoji, getMoonPhaseName, isNewMoon, isFullMoon, getAstroEventsForDate, getAstroEventsForMonth } from "@/lib/astro-events";

const MOON_PHASE_GUIDANCE: Record<string, { action: string; avoid: string }> = {
  "新月": { action: "许愿、开启新计划、播种意图", avoid: "犹豫不决、拖延" },
  "满月": { action: "释放、总结、感恩仪式", avoid: "情绪化决策、冲突" },
  "蛾眉月": { action: "积累能量、小步前进", avoid: "急于求成" },
  "上弦月": { action: "克服挑战、坚定行动", avoid: "半途而废" },
  "亏月": { action: "反思、断舍离、内省", avoid: "开启重大项目" },
  "残月": { action: "休息、恢复、冥想", avoid: "过度消耗精力" },
};

interface MoonCalendarProps {
  open: boolean;
  selectedDate: string;
  onClose: () => void;
}

export function MoonCalendar({ open, selectedDate, onClose }: MoonCalendarProps) {
  const today = new Date(selectedDate + "T12:00:00");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [showTodayHint, setShowTodayHint] = useState(true);

  const monthEvents = useMemo(() => getAstroEventsForMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    setSelectedDay(null);
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const selectedDateStr = selectedDay ? `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "";
  const selectedPhase = selectedDateStr ? getMoonPhaseName(new Date(selectedDateStr + "T12:00:00")) : "";
  const selectedEmoji = selectedDateStr ? getMoonPhaseEmoji(new Date(selectedDateStr + "T12:00:00")) : "";
  const selectedEvents = selectedDateStr ? getAstroEventsForDate(selectedDateStr) : [];
  const selectedGuidance = MOON_PHASE_GUIDANCE[selectedPhase];

  const isToday = (day: number) => {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1 && day === today.getDate();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed z-50 flex flex-col max-w-md mx-auto rounded-2xl border border-mystic-gold/30 shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 6, 18, 0.97)",
              top: "8%", left: "max(12px, env(safe-area-inset-left, 12px))",
              right: "max(12px, env(safe-area-inset-right, 12px))", maxHeight: "82dvh",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{getMoonPhaseEmoji(today)}</span>
                <h2 className="text-xs font-cinzel text-mystic-gold">能量日历 · 月相追踪</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-mystic-purple/20 text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(82dvh - 110px)" }}>
              {/* Month Navigator */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-mystic-purple/20 text-text-secondary hover:text-text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-text-primary font-cinzel">{viewYear}年{viewMonth}月</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-mystic-purple/20 text-text-secondary hover:text-text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-[10px] text-text-tertiary py-1">周{d}</div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const phase = getMoonPhase(new Date(dateStr + "T12:00:00"));
                  const emoji = getMoonPhaseEmoji(new Date(dateStr + "T12:00:00"));
                  const isNew = isNewMoon(new Date(dateStr + "T12:00:00"));
                  const isFull = isFullMoon(new Date(dateStr + "T12:00:00"));
                  const events = monthEvents.get(dateStr);
                  const hasRx = events?.some(e => e.type === "mercury-rx" || e.type === "venus-rx");
                  const isTodayDate = isToday(day);
                  const isSel = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                        isSel ? "bg-mystic-gold/20 border border-mystic-gold/40" :
                        isTodayDate ? "bg-mystic-purple/20 border border-mystic-purple/30" :
                        "hover:bg-mystic-purple/10 border border-transparent"
                      }`}
                    >
                      {isNew && <span className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {isFull && <span className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {hasRx && <span className="absolute -bottom-0.5 w-full h-0.5 rounded-full bg-red-400/40" />}
                      <span className="text-sm">{emoji}</span>
                      <span className={`text-[10px] ${isTodayDate ? "text-mystic-gold font-bold" : "text-text-secondary"}`}>{day}</span>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[10px] text-text-tertiary mb-4 justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> 新月</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 满月</span>
                <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded-full bg-red-400/40" /> 水逆/金逆</span>
              </div>

              {/* Selected Day Detail */}
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-mystic-dark/40 border border-mystic-purple/20 mb-3"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{selectedEmoji}</span>
                    <div>
                      <p className="text-sm text-text-primary font-medium">{viewMonth}月{selectedDay}日 · {selectedPhase}</p>
                      {selectedEvents.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEvents.map((e, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              e.type === "mercury-rx" ? "bg-red-500/10 text-red-400 border border-red-400/20" :
                              e.type === "venus-rx" ? "bg-pink-500/10 text-pink-400 border border-pink-400/20" :
                              "bg-blue-500/10 text-blue-400 border border-blue-400/20"
                            }`}>{e.icon} {e.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedGuidance && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-green-500/5 border border-green-400/15">
                        <p className="text-[9px] text-green-400/60 mb-0.5">适合</p>
                        <p className="text-[10px] text-text-secondary">{selectedGuidance.action}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/5 border border-red-400/15">
                        <p className="text-[9px] text-red-400/60 mb-0.5">避免</p>
                        <p className="text-[10px] text-text-secondary">{selectedGuidance.avoid}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Today guidance hint */}
              {showTodayHint && (
                <div className="p-3 rounded-xl bg-mystic-gold/5 border border-mystic-gold/15 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-mystic-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-text-secondary">
                      今日{getMoonPhaseName(today)} · {MOON_PHASE_GUIDANCE[getMoonPhaseName(today)]?.action || "顺其自然"}
                    </p>
                  </div>
                  <button onClick={() => setShowTodayHint(false)} className="text-text-tertiary hover:text-text-primary shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-mystic-purple/20 shrink-0 text-center">
              <button onClick={onClose} className="px-5 py-2 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/20 transition-colors text-xs">
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
