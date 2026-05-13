"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import {
  isLoggedIn, apiSaveJournalEntry, apiGetMonthJournal,
  apiGetJournalEntry, apiDeleteJournalEntry, logout,
} from "@/lib/api-client";
import {
  getLocalJournalsForMonth, getLocalJournalByDate,
  saveLocalJournal, deleteLocalJournal,
  type LocalJournalEntry,
} from "@/lib/journal-local";
import { getDailyCard, type DailyCard } from "@/lib/daily-seed";
import { tarotCards, type TarotCard } from "@/lib/tarot-data";
import JournalCalendar from "@/components/JournalCalendar";
import JournalEntrySheet from "@/components/JournalEntrySheet";

const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

export default function JournalPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<Map<string, LocalJournalEntry>>(new Map());
  const [entrySaving, setEntrySaving] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    loadMonth();
  }, [currentMonth]);

  const loadMonth = async () => {
    setLoading(true);
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

    try {
      const data = await apiGetMonthJournal(monthStr);
      if (data?.entries) {
        const map = new Map<string, LocalJournalEntry>();
        for (const e of data.entries) {
          map.set(e.date, {
            id: e.id,
            date: e.date,
            cardId: e.card_id,
            isReversed: e.is_reversed,
            mood: e.mood,
            note: e.note,
            synced: true,
          });
        }
        setEntries(map);
      }
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("令牌")) {
        logout(); router.push("/login"); return;
      }
      // Fallback to localStorage
      const local = getLocalJournalsForMonth(monthStr);
      const map = new Map<string, LocalJournalEntry>();
      for (const e of local) map.set(e.date, e);
      setEntries(map);
    } finally {
      setLoading(false);
    }
  };

  // Derived: entries as { mood, hasEntry } for calendar
  const calendarData = useMemo(() => {
    const map = new Map<string, { mood?: number; hasEntry: boolean }>();
    for (const [date, e] of entries) {
      map.set(date, { mood: e.mood, hasEntry: true });
    }
    return map;
  }, [entries]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) setCurrentMonth(next);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSheetOpen(true);
  };

  const handleSaveEntry = async (data: { mood: number | null; note: string }) => {
    if (!selectedDate) return;
    setEntrySaving(true);

    const dailyCard = getDailyCard(new Date(selectedDate));
    const localEntry: LocalJournalEntry = {
      id: entries.get(selectedDate)?.id || Date.now(),
      date: selectedDate,
      cardId: dailyCard.card.id,
      isReversed: dailyCard.isReversed,
      mood: data.mood ?? undefined,
      note: data.note || undefined,
      synced: false,
    };

    // Save locally first
    saveLocalJournal(localEntry);
    setEntries((prev) => {
      const next = new Map(prev);
      next.set(selectedDate, localEntry);
      return next;
    });

    // Sync to server
    try {
      const result = await apiSaveJournalEntry({
        date: selectedDate,
        card_id: dailyCard.card.id,
        is_reversed: dailyCard.isReversed,
        mood: data.mood ?? undefined,
        note: data.note || undefined,
      });
      const syncedEntry = { ...localEntry, id: result.id, synced: true };
      saveLocalJournal(syncedEntry);
      setEntries((prev) => {
        const next = new Map(prev);
        next.set(selectedDate, syncedEntry);
        return next;
      });
    } catch {
      // Local save is sufficient
    }
    setEntrySaving(false);
  };

  const handleDeleteEntry = async () => {
    if (!selectedDate) return;
    const entry = entries.get(selectedDate);
    if (!entry) return;

    deleteLocalJournal(entry.id);
    setEntries((prev) => {
      const next = new Map(prev);
      next.delete(selectedDate);
      return next;
    });

    if (entry.synced && entry.id) {
      try { await apiDeleteJournalEntry(entry.id); } catch {}
    }
    setSheetOpen(false);
  };

  // Get card for selected date
  const selectedCard = useMemo(() => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate);
    const daily = getDailyCard(dateObj);
    return daily;
  }, [selectedDate, sheetOpen]);

  const selectedEntry = selectedDate ? entries.get(selectedDate) : null;
  const isNextMonthDisabled = currentMonth >= new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-mystic-rose/50 hover:text-mystic-rose transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-cinzel text-mystic-gold text-glow">塔罗日记</h1>
          <p className="text-xs text-mystic-rose/40 mt-2">Tarot Diary</p>
        </motion.div>

        {/* Month navigator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-mystic-purple/10 text-mystic-rose/50 hover:text-mystic-rose transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm font-cinzel text-mystic-gold/80">
            {`${currentMonth.getFullYear()} ${MONTH_NAMES[currentMonth.getMonth()]}`}
          </p>
          <button
            onClick={handleNextMonth}
            disabled={isNextMonthDisabled}
            className={`p-2 rounded-full hover:bg-mystic-purple/10 transition-colors ${
              isNextMonthDisabled ? "text-mystic-rose/10 pointer-events-none" : "text-mystic-rose/50 hover:text-mystic-rose"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 mb-8"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-mystic-gold animate-spin" />
            </div>
          ) : (
            <JournalCalendar
              year={currentMonth.getFullYear()}
              month={currentMonth.getMonth() + 1}
              entries={calendarData}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[10px] text-foreground/30"
        >
          每天写下一句话，让牌面见证你的成长轨迹
        </motion.p>
      </div>

      {/* Entry Sheet */}
      {selectedCard && (
        <JournalEntrySheet
          open={sheetOpen}
          date={selectedDate || ""}
          entry={
            selectedEntry
              ? { id: selectedEntry.id, mood: selectedEntry.mood, note: selectedEntry.note }
              : null
          }
          card={selectedCard.card}
          isReversed={selectedCard.isReversed}
          onSave={handleSaveEntry}
          onDelete={selectedEntry ? handleDeleteEntry : undefined}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
