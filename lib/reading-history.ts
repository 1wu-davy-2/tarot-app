export interface ReadingCard {
  nameCN: string;
  imageUrl: string;
  isReversed: boolean;
  position: string;
}

export interface ReadingRecord {
  id: string;
  date: string;
  spreadType: string;
  question?: string;
  cards: ReadingCard[];
  aiInterpretation?: string;
  standardInterpretation?: string;
}

const STORAGE_KEY = "tarot_reading_history";
const MAX_ENTRIES = 50;

export function getReadings(): ReadingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadingRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveReading(record: ReadingRecord) {
  const readings = getReadings();
  readings.unshift(record);
  if (readings.length > MAX_ENTRIES) readings.length = MAX_ENTRIES;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  } catch { /* quota exceeded */ }
}

export function deleteReading(id: string) {
  const readings = getReadings().filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  } catch { /* quota exceeded */ }
}

export function updateReading(id: string, updates: Partial<ReadingRecord>) {
  const readings = getReadings();
  const idx = readings.findIndex((r) => r.id === id);
  if (idx !== -1) {
    readings[idx] = { ...readings[idx], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    } catch { /* quota exceeded */ }
  }
}

export function clearReadings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* quota exceeded */ }
}
