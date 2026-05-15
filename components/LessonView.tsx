"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, BookOpen } from "lucide-react";
import { type Lesson, type LessonModule, getModuleProgress, markLessonComplete, isLessonComplete, loadProgressFromServer } from "@/lib/tarot-lessons";
import { useState, useEffect } from "react";

interface LessonViewProps {
  module: LessonModule;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function LessonView({ module, lesson, lessonIndex, totalLessons, onBack, onPrev, onNext }: LessonViewProps) {
  const [done, setDone] = useState(false);
  const progress = getModuleProgress(module.id);

  useEffect(() => {
    setDone(isLessonComplete(lesson.id));
  }, [lesson.id]);

  const handleMark = () => {
    markLessonComplete(lesson.id);
    setDone(true);
  };

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{module.title}</span>
          </button>
          <span className="text-[10px] text-text-tertiary">{lessonIndex + 1}/{totalLessons}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/8 mb-6 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mystic-purple to-mystic-gold"
            animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>

        {/* Lesson content */}
        <motion.div
          key={lesson.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{module.icon}</span>
            <span className="text-[10px] text-text-tertiary">{module.title}</span>
          </div>
          <h1 className="text-lg font-cinzel text-mystic-gold mb-4">{lesson.title}</h1>

          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
            {lesson.content}
          </div>

          {/* Key points */}
          <div className="mt-6 pt-4 border-t border-white/8">
            <p className="text-[10px] text-text-tertiary mb-2">📌 关键要点</p>
            <ul className="space-y-1">
              {lesson.keyPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                  <span className="text-mystic-gold/60 shrink-0 mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={lessonIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 上一课
          </button>

          <button
            onClick={handleMark}
            disabled={done}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all ${
              done
                ? "bg-green-500/15 border border-green-400/30 text-green-400"
                : "bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/20"
            }`}
          >
            {done ? <><Check className="w-3.5 h-3.5" /> 已完成</> : <><BookOpen className="w-3.5 h-3.5" /> 标记完成</>}
          </button>

          <button
            onClick={onNext}
            disabled={lessonIndex >= totalLessons - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            下一课 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
