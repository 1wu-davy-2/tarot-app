export interface LocalJournalEntry {
  id: number;            // server ID, or Date.now() for unsynced
  date: string;          // "YYYY-MM-DD"
  cardId: number;
  isReversed: boolean;
  mood?: number;         // 1-5
  note?: string;
  synced: boolean;       // true when saved to server
}

const STORAGE_KEY = "tarot_journal";

export function getLocalJournals(): LocalJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalJournalsForMonth(month: string): LocalJournalEntry[] {
  return getLocalJournals().filter((e) => e.date.startsWith(month));
}

export function getLocalJournalByDate(date: string): LocalJournalEntry | undefined {
  return getLocalJournals().find((e) => e.date === date);
}

export function saveLocalJournal(entry: LocalJournalEntry) {
  const all = getLocalJournals().filter((e) => e.date !== entry.date);
  all.unshift(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* quota exceeded */ }
}

export function deleteLocalJournal(id: number) {
  const all = getLocalJournals().filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* quota exceeded */ }
}

export function updateLocalJournal(id: number, updates: Partial<LocalJournalEntry>) {
  const all = getLocalJournals();
  const idx = all.findIndex((e) => e.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { /* quota exceeded */ }
  }
}
