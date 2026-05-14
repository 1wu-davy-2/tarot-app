"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, ChevronDown } from "lucide-react";

const ZODIAC_OPTIONS = [
  "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
  "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
];

export function BirthChartSection({
  birthDate, setBirthDate, birthTime, setBirthTime,
  birthPlace, setBirthPlace, zodiacSign, setZodiacSign,
  birthSaving, birthMsg, onSave, getCompletionPercent,
}: any) {
  const [expanded, setExpanded] = useState(false);
  const filled = !!(birthDate || birthTime || birthPlace || zodiacSign);
  const autoExpand = !filled; // auto expand when empty

  const effectiveExpanded = autoExpand || expanded;
  const derivedZodiac = birthDate ? deriveZodiac(birthDate) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass-card p-4 sm:p-6 mb-4"
    >
      <button
        onClick={() => filled && setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-cinzel text-mystic-gold whitespace-nowrap">出生星盘</span>
          {filled && !effectiveExpanded && (
            <span className="text-[11px] text-foreground/65 truncate">
              {zodiacSign || (derivedZodiac ? `♓ ${derivedZodiac}` : "")}
              {birthDate ? ` · ${birthDate}` : ""}
              {birthTime ? ` · ${birthTime}` : ""}
              {birthPlace ? ` · ${birthPlace}` : ""}
            </span>
          )}
        </div>
        {filled && (
          <ChevronDown className={`w-4 h-4 text-mystic-rose/45 transition-transform duration-300 ${effectiveExpanded ? "rotate-180" : ""}`} />
        )}
      </button>

      {effectiveExpanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
          <div className="space-y-4 mt-4 pt-4 border-t border-mystic-purple/10">
            <div>
              <label className="block text-[11px] text-mystic-rose/55 mb-1.5 ml-1">出生日期</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[11px] text-mystic-rose/55 mb-1.5 ml-1">出生时间</label>
              <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[11px] text-mystic-rose/55 mb-1.5 ml-1">出生地点</label>
              <input type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="输入城市名称，如'北京'" maxLength={100}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/40 focus:outline-none focus:border-mystic-gold/40 transition-colors" />
            </div>
            {!derivedZodiac && (
              <div>
                <label className="block text-[11px] text-mystic-rose/55 mb-1.5 ml-1">星座</label>
                <select value={zodiacSign} onChange={(e) => setZodiacSign(e.target.value)}
                  className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-mystic-gold/40 transition-colors"
                  style={{ colorScheme: "dark" }}>
                  <option value="">选择星座（可选）</option>
                  {ZODIAC_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={onSave} disabled={birthSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 transition-all text-sm disabled:opacity-50">
                {birthSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存星盘信息
              </button>
              {birthMsg && <span className={`text-xs ${birthMsg.includes("失败") ? "text-red-400/60" : "text-mystic-rose/65"}`}>{birthMsg}</span>}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function deriveZodiac(birthDate: string): string | null {
  const parts = birthDate.split("-");
  if (parts.length < 2) return null;
  const m = parseInt(parts[1]), d = parseInt(parts[2]);
  if (isNaN(m) || isNaN(d)) return null;
  const ranges: [number, number, string][] = [
    [3, 21, "白羊座"], [4, 20, "金牛座"], [5, 21, "双子座"], [6, 22, "巨蟹座"],
    [7, 23, "狮子座"], [8, 23, "处女座"], [9, 23, "天秤座"], [10, 24, "天蝎座"],
    [11, 23, "射手座"], [12, 22, "摩羯座"], [1, 20, "水瓶座"], [2, 19, "双鱼座"],
  ];
  for (let i = 0; i < ranges.length; i++) {
    const [rm, rd, name] = ranges[i];
    const next = ranges[(i + 1) % ranges.length];
    if (m === rm && d >= rd) return name;
    if (m === next[0] && d < next[1]) return name;
  }
  return "摩羯座";
}
