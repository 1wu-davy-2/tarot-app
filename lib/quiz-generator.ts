// Tarot card quiz generator — pure client-side, no backend needed.
// Uses tarotCards data, generates questions with plausible distractors.

import { tarotCards, type TarotCard } from "./tarot-data";

export type QuizQuestionType =
  | "name_to_meaning"     // Given card name, pick the correct meaning
  | "meaning_to_name"     // Given meaning, pick the correct card name
  | "arcana_classify"     // Pick if a card is major or minor arcana
  | "suit_identify"       // Given card name, identify its suit
  | "element_match";      // Given card name, identify its element

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctIndex: number;
  card: { nameCN: string; name: string; arcana: string; suit?: string; element?: string };
  correctFeedback: string; // shown on wrong answer
}

const ALL_TYPES: QuizQuestionType[] = [
  "name_to_meaning",
  "meaning_to_name",
  "arcana_classify",
  "suit_identify",
  "element_match",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick distractors (wrong options) from other cards
function pickDistractors(
  correct: TarotCard,
  count: number,
  property: "nameCN" | "suit" | "element" | "arcana" = "nameCN"
): string[] {
  const others = tarotCards.filter((c) => c.id !== correct.id);
  const shuffled = shuffle(others);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const c of shuffled) {
    let val = "";
    switch (property) {
      case "nameCN": val = c.nameCN; break;
      case "suit": val = c.suit === "wands" ? "权杖" : c.suit === "cups" ? "圣杯" : c.suit === "swords" ? "宝剑" : c.suit === "pentacles" ? "星币" : "无"; break;
      case "element": val = c.element || "无"; break;
      case "arcana": val = c.arcana === "major" ? "大阿卡纳" : "小阿卡纳"; break;
    }
    if (val && val !== correctValue(correct, property) && !seen.has(val)) {
      seen.add(val);
      result.push(val);
    }
    if (result.length >= count) break;
  }

  // Fallback if not enough distractors
  while (result.length < count) {
    result.push(`选项 ${String.fromCharCode(65 + result.length)}`);
  }

  return shuffle(result);
}

function correctValue(card: TarotCard, property: string): string {
  switch (property) {
    case "nameCN": return card.nameCN;
    case "suit": return card.suit === "wands" ? "权杖" : card.suit === "cups" ? "圣杯" : card.suit === "swords" ? "宝剑" : card.suit === "pentacles" ? "星币" : "无";
    case "element": return card.element || "无";
    case "arcana": return card.arcana === "major" ? "大阿卡纳" : "小阿卡纳";
    default: return "";
  }
}

function generateQuestion(card: TarotCard): QuizQuestion {
  // Prefer types that make sense for this card
  let types = [...ALL_TYPES];
  if (card.arcana === "major") {
    // Major arcana doesn't have suits — skip suit_identify
    types = types.filter((t) => t !== "suit_identify");
  }
  if (!card.element) {
    types = types.filter((t) => t !== "element_match");
  }

  const type = types[randInt(0, types.length - 1)];

  let question = "";
  let correctAnswer = "";
  let distractors: string[] = [];
  let correctFeedback = "";

  switch (type) {
    case "name_to_meaning": {
      question = `"${card.nameCN}"的正位核心含义是什么？`;
      correctAnswer = card.uprightMeaning;
      distractors = pickDistractors(card, 3, "nameCN").length >= 3
        ? pickDistractors(card, 3, "nameCN") // actually pick meaning-like wrong answers
        : shuffle(tarotCards.filter((c) => c.id !== card.id)).slice(0, 3).map((c) => c.uprightMeaning);
      // Ensure 3 unique distractors
      const seen = new Set([correctAnswer]);
      distractors = [];
      for (const c of shuffle(tarotCards.filter((c2) => c2.id !== card.id))) {
        if (!seen.has(c.uprightMeaning)) {
          seen.add(c.uprightMeaning);
          distractors.push(c.uprightMeaning);
        }
        if (distractors.length >= 3) break;
      }
      correctFeedback = `${card.nameCN} 正位：${card.uprightMeaning}`;
      break;
    }
    case "meaning_to_name": {
      question = `以下哪张牌的含义是"${card.uprightMeaning.slice(0, 30)}..."？`;
      correctAnswer = card.nameCN;
      distractors = pickDistractors(card, 3, "nameCN");
      correctFeedback = `${card.nameCN}：${card.uprightMeaning}`;
      break;
    }
    case "arcana_classify": {
      question = `"${card.nameCN}"属于哪个类别？`;
      correctAnswer = card.arcana === "major" ? "大阿卡纳" : "小阿卡纳";
      distractors = [card.arcana === "major" ? "小阿卡纳" : "大阿卡纳"];
      // Add more generic distractors
      if (distractors.length < 3) {
        if (card.suit) distractors.push("大阿卡纳");
        distractors.push(card.suit === "wands" ? "权杖组" : "圣杯组");
        distractors.push("宫廷牌");
      }
      distractors = shuffle(distractors).slice(0, 3);
      correctFeedback = `${card.nameCN} 属于${correctAnswer}`;
      break;
    }
    case "suit_identify": {
      const suitMap: Record<string, string> = { wands: "权杖", cups: "圣杯", swords: "宝剑", pentacles: "星币" };
      correctAnswer = suitMap[card.suit || ""] || "无花色";
      distractors = pickDistractors(card, 3, "suit");
      correctFeedback = `${card.nameCN} 属于${correctAnswer}组`;
      break;
    }
    case "element_match": {
      correctAnswer = card.element || "无";
      distractors = pickDistractors(card, 3, "element");
      correctFeedback = `${card.nameCN} 的元素是 ${correctAnswer}`;
      break;
    }
    default: {
      question = `"${card.nameCN}"属于哪个类别？`;
      correctAnswer = card.arcana === "major" ? "大阿卡纳" : "小阿卡纳";
      distractors = ["大阿卡纳", "小阿卡纳", "宫廷牌", "数字牌"];
      distractors = shuffle(distractors.filter((d) => d !== correctAnswer)).slice(0, 3);
      correctFeedback = `${card.nameCN} 属于${correctAnswer}`;
    }
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    id: `q-${card.id}-${type}-${Date.now()}`,
    type,
    question,
    options,
    correctIndex,
    card: {
      nameCN: card.nameCN,
      name: card.name,
      arcana: card.arcana,
      suit: card.suit,
      element: card.element,
    },
    correctFeedback,
  };
}

export function generateQuiz(count: number = 10): QuizQuestion[] {
  // Prioritize cards the user hasn't mastered yet
  let learnedIds: Set<number>;
  try {
    learnedIds = new Set(JSON.parse(localStorage.getItem("tarot_learned_cards") || "[]") as number[]);
  } catch { learnedIds = new Set(); }

  const unlearned = tarotCards.filter((c) => !learnedIds.has(c.id));
  const learned = tarotCards.filter((c) => learnedIds.has(c.id));

  // 70% unlearned, 30% learned (for review)
  const unlearnedCount = Math.min(unlearned.length, Math.ceil(count * 0.7));
  const learnedCount = Math.min(learned.length, count - unlearnedCount);
  const extraUnlearned = count - unlearnedCount - learnedCount;

  const pool = [
    ...shuffle(unlearned).slice(0, unlearnedCount + extraUnlearned),
    ...shuffle(learned).slice(0, learnedCount),
  ];

  return shuffle(pool.slice(0, count)).map((card) => generateQuestion(card));
}

export interface QuizResult {
  score: number;
  total: number;
  pct: number;
  wrong: QuizQuestion[];
}

export function gradeQuiz(questions: QuizQuestion[], answers: Map<string, number>): QuizResult {
  let correct = 0;
  const wrong: QuizQuestion[] = [];

  for (const q of questions) {
    const userAnswer = answers.get(q.id);
    if (userAnswer === q.correctIndex) {
      correct++;
    } else {
      wrong.push(q);
    }
  }

  return {
    score: correct,
    total: questions.length,
    pct: Math.round((correct / questions.length) * 100),
    wrong,
  };
}

// Save quiz history to localStorage
export function saveQuizResult(result: QuizResult) {
  try {
    const history = JSON.parse(localStorage.getItem("tarot_quiz_history") || "[]") as QuizResult[];
    history.push({ ...result, wrong: [] }); // Don't store full wrong questions (too big)
    // Keep last 50
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem("tarot_quiz_history", JSON.stringify(history));
  } catch {}
}

export function getQuizStats(): {
  totalQuizzes: number;
  avgScore: number;
  bestScore: number;
} {
  try {
    const history = JSON.parse(localStorage.getItem("tarot_quiz_history") || "[]") as QuizResult[];
    if (!history.length) return { totalQuizzes: 0, avgScore: 0, bestScore: 0 };
    const total = history.length;
    const avg = Math.round(history.reduce((s, r) => s + r.pct, 0) / total);
    const best = Math.max(...history.map((r) => r.pct));
    return { totalQuizzes: total, avgScore: avg, bestScore: best };
  } catch { return { totalQuizzes: 0, avgScore: 0, bestScore: 0 }; }
}

// Learning progress helpers
export function getLearnedCards(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem("tarot_learned_cards") || "[]") as number[]);
  } catch { return new Set(); }
}

export function markCardLearned(cardId: number) {
  const learned = getLearnedCards();
  learned.add(cardId);
  localStorage.setItem("tarot_learned_cards", JSON.stringify([...learned]));
  // Also remove from learning list
  try {
    const list = JSON.parse(localStorage.getItem("tarot_learning_list") || "[]") as number[];
    localStorage.setItem("tarot_learning_list", JSON.stringify(list.filter((id) => id !== cardId)));
  } catch {}
}

export function addToLearningList(cardId: number) {
  try {
    const list = JSON.parse(localStorage.getItem("tarot_learning_list") || "[]") as number[];
    if (!list.includes(cardId)) {
      list.push(cardId);
      localStorage.setItem("tarot_learning_list", JSON.stringify(list));
    }
  } catch {}
}

export function getLearnedCountBySuit(): Record<string, number> {
  const learned = getLearnedCards();
  const counts: Record<string, number> = { major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 };
  for (const id of learned) {
    const card = tarotCards.find((c) => c.id === id);
    if (!card) continue;
    if (card.arcana === "major") counts.major++;
    else if (card.suit) counts[card.suit] = (counts[card.suit] || 0) + 1;
  }
  return counts;
}

export const SUIT_LABELS: Record<string, string> = {
  major: "大阿卡纳",
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币",
};

export const SUIT_TOTALS: Record<string, number> = {
  major: 22,
  wands: 14,
  cups: 14,
  swords: 14,
  pentacles: 14,
};
