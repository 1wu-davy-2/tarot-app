"use client";

import { motion } from "framer-motion";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const MOOD_EMOJIS: Record<number, string> = {
  1: "😊",
  2: "😔",
  3: "😡",
  4: "😰",
  5: "🤔",
};

interface JournalCalendarProps {
  year: number;
  month: number;           // 1-12
  entries: Map<string, { mood?: number; hasEntry: boolean }>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export default function JournalCalendar({
  year,
  month,
  entries,
  selectedDate,
  onSelectDate,
}: JournalCalendarProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  // 0=Sun, 1=Mon ... 6=Sat → we want Mon=0, Sun=6
  const startDow = firstDay.getDay();
  const startOffset = startDow === 0 ? 6 : startDow - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] text-mystic-rose/30 font-cinzel py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const info = entries.get(dateStr);
          const hasEntry = info?.hasEntry;
          const mood = info?.mood;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > todayStr;

          return (
            <motion.button
              key={dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              disabled={isFuture}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg relative transition-all
                ${isFuture ? "opacity-15 pointer-events-none" : "hover:bg-mystic-purple/10"}
                ${isSelected ? "bg-mystic-purple/15 ring-1 ring-mystic-purple/40" : ""}
              `}
            >
              {/* Today ring */}
              {isToday && (
                <div className="absolute inset-0.5 rounded-lg ring-1 ring-mystic-gold/50" />
              )}

              {/* Day number */}
              <span
                className={`text-xs font-cormorant ${
                  isToday ? "text-mystic-gold" : hasEntry ? "text-foreground/80" : "text-foreground/40"
                }`}
              >
                {day}
              </span>

              {/* Mood emoji or entry dot */}
              {hasEntry && mood ? (
                <span className="text-sm mt-0.5">{MOOD_EMOJIS[mood]}</span>
              ) : hasEntry ? (
                <div className="w-1 h-1 rounded-full bg-mystic-gold/60 mt-1" />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
