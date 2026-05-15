"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, XCircle, RotateCcw, Brain } from "lucide-react";
import {
  generateQuiz, gradeQuiz, saveQuizResult,
  type QuizQuestion, type QuizResult,
} from "@/lib/quiz-generator";

interface Props {
  open: boolean;
  onClose: () => void;
  count?: number;
}

export function QuizModal({ open, onClose, count = 10 }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [result, setResult] = useState<QuizResult | null>(null);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");

  useEffect(() => {
    if (open) {
      const qs = generateQuiz(count);
      setQuestions(qs);
      setCurrentIdx(0);
      setSelected(null);
      setAnswered(false);
      setAnswers(new Map());
      setResult(null);
      setPhase("quiz");
    }
  }, [open, count]);

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    const newAnswers = new Map(answers);
    newAnswers.set(questions[currentIdx].id, optIdx);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      // Quiz complete
      const r = gradeQuiz(questions, answers);
      saveQuizResult(r);
      setResult(r);
      setPhase("result");
    }
  };

  const handleRestart = () => {
    const qs = generateQuiz(count);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setAnswers(new Map());
    setResult(null);
    setPhase("quiz");
  };

  if (!open) return null;

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + (answered ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#0f0a1a] border border-mystic-purple/30 rounded-2xl shadow-2xl p-6"
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-mystic-rose z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-mystic-gold" />
          <h3 className="text-lg font-cinzel text-mystic-gold">牌意测验</h3>
        </div>

        {phase === "quiz" && currentQ && (
          <>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-mystic-purple/15 mb-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-text-secondary mb-4">
              第 {currentIdx + 1}/{questions.length} 题
            </p>

            {/* Question */}
            <p className="text-sm text-text-primary mb-5 leading-relaxed">
              {currentQ.question}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === currentQ.correctIndex;
                let borderColor = "border-mystic-purple/20 hover:border-mystic-rose/30";
                if (answered) {
                  if (isCorrect) borderColor = "border-emerald-400/40 bg-emerald-400/5";
                  else if (isSelected && !isCorrect) borderColor = "border-red-400/40 bg-red-400/5";
                } else if (isSelected) {
                  borderColor = "border-mystic-gold/40 bg-mystic-gold/5";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${borderColor} ${
                      answered ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-mystic-purple/20 flex items-center justify-center text-[10px] text-text-secondary shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-text-primary">{opt}</span>
                      {answered && isCorrect && <Check className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                      {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {answered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <p className="text-xs text-text-secondary bg-mystic-purple/10 rounded-lg p-3">
                  {currentQ.correctFeedback}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full mt-3 py-2.5 rounded-xl bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-sm hover:bg-mystic-gold/20 transition-all"
                >
                  {currentIdx < questions.length - 1 ? "下一题" : "查看结果"}
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Results */}
        {phase === "result" && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">
                {result.pct >= 80 ? "🎉" : result.pct >= 60 ? "👍" : "📚"}
              </p>
              <p className="text-2xl font-cinzel text-mystic-gold">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                正确率 {result.pct}%
              </p>
            </div>

            {/* Wrong answers review */}
            {result.wrong.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-cinzel text-text-secondary mb-3">
                  错题回顾 ({result.wrong.length} 题)
                </p>
                <div className="space-y-2">
                  {result.wrong.map((q) => (
                    <div key={q.id} className="p-3 rounded-lg bg-red-400/5 border border-red-400/15">
                      <p className="text-[11px] text-text-secondary">{q.question}</p>
                      <p className="text-[10px] text-text-secondary mt-1">{q.correctFeedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.wrong.length === 0 && (
              <p className="text-center text-sm text-mystic-gold/70 mb-5">全部正确，完美！</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-mystic-gold/30 text-mystic-gold text-sm hover:bg-mystic-gold/10 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                再来一次
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-mystic-purple/20 text-text-secondary text-sm hover:bg-mystic-purple/10 transition-all"
              >
                关闭
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
