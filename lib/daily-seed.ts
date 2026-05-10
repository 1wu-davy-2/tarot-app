import { tarotCards, type TarotCard } from "./tarot-data";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface DailyCard {
  card: TarotCard;
  isReversed: boolean;
  date: string;
}

export function getDailyCard(date?: Date): DailyCard {
  const now = date ?? new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const seed = hashString(dateStr);
  const cardIndex = seed % tarotCards.length;
  const isReversed = (seed % 2) === 1;

  return {
    card: tarotCards[cardIndex],
    isReversed,
    date: dateStr,
  };
}
