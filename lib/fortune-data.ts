// Deterministic lucky item generator based on date + zodiac sign.
// Same date + same zodiac = same results every day.

const ZODIAC_SIGNS = [
  "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
  "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
];

const LUCKY_COLORS = [
  { name: "金色", hex: "#d4a853" }, { name: "紫色", hex: "#7c3aed" },
  { name: "蓝色", hex: "#3b82f6" }, { name: "绿色", hex: "#22c55e" },
  { name: "粉色", hex: "#ec4899" }, { name: "橙色", hex: "#f97316" },
  { name: "白色", hex: "#f8fafc" }, { name: "红色", hex: "#ef4444" },
  { name: "银色", hex: "#94a3b8" }, { name: "青色", hex: "#06b6d4" },
  { name: "茶色", hex: "#a16207" }, { name: "珊瑚色", hex: "#fb7185" },
];

const LUCKY_NUMBERS = [
  [3, 7, 15, 22, 36], [2, 8, 14, 26, 33],
  [1, 5, 11, 28, 35], [4, 9, 18, 25, 31],
  [5, 12, 19, 27, 38], [3, 6, 16, 23, 32],
  [2, 7, 13, 22, 34], [1, 8, 17, 24, 37],
  [4, 9, 14, 21, 33], [3, 6, 15, 28, 36],
  [5, 11, 18, 25, 39], [2, 7, 16, 23, 35],
];

const LUCKY_DIRECTIONS = ["东方", "东南", "南方", "西南", "西方", "西北", "北方", "东北"];
const LUCKY_FOODS = ["蜂蜜柠檬水", "红枣枸杞茶", "玫瑰花瓣糖", "黑巧克力", "抹茶拿铁", "南瓜汤", "紫薯饼", "桂花糕", "杏仁豆腐", "红豆沙", "姜茶", "椰子水"];
const LUCKY_FLOWERS = ["白玫瑰", "薰衣草", "向日葵", "百合", "樱花", "紫罗兰", "牡丹", "莲花", "雏菊", "郁金香", "茉莉", "鸢尾花"];
const LUCKY_ACCESSORIES = ["黑曜石手链", "月光石吊坠", "黄水晶戒指", "红玛瑙", "绿松石", "紫水晶", "虎眼石", "珍珠", "翡翠", "白水晶", "粉晶", "蓝宝石"];
const LUCKY_TIMES = ["07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00", "15:00-17:00", "17:00-19:00"];
const LUCKY_ITEMS = ["笔记本", "护身符", "镜子", "硬币", "钥匙扣", "书签", "小摆件", "幸运绳", "小铃铛", "水晶球", "羽毛", "贝壳"];

const ENERGY_TASKS = [
  { icon: "🧘", title: "三分钟冥想", desc: "闭眼深呼吸，想象金色光芒包围自己" },
  { icon: "📝", title: "写下三个愿望", desc: "在纸上写下今天最想完成的3件事" },
  { icon: "🚶", title: "五行散步", desc: "朝着幸运方位步行5分钟，感受大地能量" },
  { icon: "💧", title: "能量水仪式", desc: "喝一杯温水，想象清洗体内负能量" },
  { icon: "🕯️", title: "点燃蜡烛", desc: "点燃一支蜡烛（或想象），专注1分钟" },
  { icon: "🌸", title: "闻香静心", desc: "闻一下花香或精油，深呼吸5次" },
  { icon: "🌈", title: "色彩冥想", desc: "想象幸运色包围自己，吸入积极能量" },
  { icon: "💎", title: "触碰幸运物", desc: "手持幸运石或随身物品，默念心愿" },
  { icon: "🎵", title: "听一首能量音乐", desc: "找一首528Hz或432Hz的频率音乐聆听" },
  { icon: "🙏", title: "感恩日记", desc: "写下今天最感恩的3件小事" },
  { icon: "☀️", title: "日光充电", desc: "面朝阳光方向站立2分钟，感受温暖" },
  { icon: "🌙", title: "月亮许愿", desc: "对着天空许下一个小小的心愿" },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickIndex(hash: number, length: number, offset: number = 0): number {
  return (hash + offset) % length;
}

export interface LuckyItems {
  color: { name: string; hex: string };
  number: number;
  direction: string;
  food: string;
  flower: string;
  accessory: string;
  timeSlot: string;
  item: string;
  tasks: { icon: string; title: string; desc: string }[];
}

export function getZodiacIndex(zodiac: string): number {
  return ZODIAC_SIGNS.findIndex((z) => z === zodiac);
}

export function generateLuckyItems(zodiac: string, dateStr?: string): LuckyItems {
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const zodiacIdx = getZodiacIndex(zodiac);
  const seed = hashCode(`${today}-${zodiac}-${zodiacIdx}`);
  const seed2 = hashCode(`${zodiac}-${today.split("-").reverse().join("")}`);

  const colorIdx = pickIndex(seed, LUCKY_COLORS.length);
  const numArr = LUCKY_NUMBERS[Math.max(0, zodiacIdx >= 0 ? zodiacIdx : 0) % LUCKY_NUMBERS.length];
  const numIdx = pickIndex(seed2, numArr.length);
  const dirIdx = pickIndex(seed, LUCKY_DIRECTIONS.length, 3);
  const foodIdx = pickIndex(seed, LUCKY_FOODS.length, 7);
  const flowerIdx = pickIndex(seed2, LUCKY_FLOWERS.length);
  const accIdx = pickIndex(seed, LUCKY_ACCESSORIES.length, zodiacIdx);
  const timeIdx = pickIndex(seed2, LUCKY_TIMES.length);
  const itemIdx = pickIndex(seed, LUCKY_ITEMS.length, 5);

  // Pick 2 random tasks
  const taskIdx1 = pickIndex(seed, ENERGY_TASKS.length);
  const taskIdx2 = pickIndex(seed, ENERGY_TASKS.length, 5);
  const tasks = taskIdx1 === taskIdx2
    ? [ENERGY_TASKS[taskIdx1], ENERGY_TASKS[(taskIdx1 + 1) % ENERGY_TASKS.length]]
    : [ENERGY_TASKS[taskIdx1], ENERGY_TASKS[taskIdx2]];

  return {
    color: LUCKY_COLORS[colorIdx],
    number: numArr[numIdx],
    direction: LUCKY_DIRECTIONS[dirIdx],
    food: LUCKY_FOODS[foodIdx],
    flower: LUCKY_FLOWERS[flowerIdx],
    accessory: LUCKY_ACCESSORIES[accIdx],
    timeSlot: LUCKY_TIMES[timeIdx],
    item: LUCKY_ITEMS[itemIdx],
    tasks,
  };
}

export interface FortuneScores {
  overall: number;
  love: number;
  wealth: number;
  career: number;
  study: number;
  social: number;
}

export function generateFortuneScores(zodiac: string, dateStr?: string): FortuneScores {
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const zodiacIdx = getZodiacIndex(zodiac);
  const baseSeed = hashCode(`${today}-${zodiac}-scores`);

  // Base scores between 55-88, varied by zodiac and date
  const score = (offset: number) => {
    const s = 55 + (hashCode(`${baseSeed}-${offset}`) % 34);
    return Math.min(98, s);
  };

  return {
    overall: score(1),
    love: score(2),
    wealth: score(3),
    career: score(4),
    study: score(5),
    social: score(6),
  };
}

export type Period = "daily" | "weekly" | "monthly" | "yearly";

export const PERIOD_LABELS: Record<Period, string> = {
  daily: "日", weekly: "周", monthly: "月", yearly: "年",
};

export function generatePeriodScores(zodiac: string, period: Period, dateStr?: string): FortuneScores {
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const count = period === "daily" ? 1 : period === "weekly" ? 7 : period === "monthly" ? 30 : 365;
  const keys = ["overall", "love", "wealth", "career", "study", "social"] as const;
  const result: any = {};

  for (const key of keys) {
    let sum = 0;
    for (let d = 0; d < count; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const ds = date.toISOString().slice(0, 10);
      const seed = hashCode(`${ds}-${zodiac}-scores-${key}`);
      sum += 55 + (seed % 34);
    }
    result[key] = Math.min(98, Math.round(sum / count));
  }
  return result as FortuneScores;
}

export function generatePeriodLuckyItems(zodiac: string, period: Period, dateStr?: string): LuckyItems {
  return generateLuckyItems(zodiac, dateStr || new Date().toISOString().slice(0, 10));
}

export const SCORE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  overall: { label: "综合运势", icon: "⭐", color: "#d4a853" },
  love: { label: "爱情运势", icon: "💕", color: "#ec4899" },
  wealth: { label: "财富运势", icon: "💰", color: "#22c55e" },
  career: { label: "事业运势", icon: "💼", color: "#3b82f6" },
  study: { label: "学习运势", icon: "📚", color: "#8b5cf6" },
  social: { label: "人际运势", icon: "🤝", color: "#f97316" },
};

// ── Suggest / Avoid badges (deterministic, not AI) ──

const SUGGEST_TAGS = [
  "造梦", "仪式感", "勇敢表达", "深度思考", "主动出击",
  "耐心等待", "整理收纳", "社交破冰", "断舍离", "自我投资",
  "早睡早起", "写日记", "户外散步", "学习新技能", "感恩练习",
];

const AVOID_TAGS = [
  "思绪飘忽", "泼冷水", "冲动消费", "拖延症", "过度分析",
  "熬夜透支", "情绪化决策", "盲目攀比", "多管闲事", "钻牛角尖",
  "暴饮暴食", "口无遮拦", "三分钟热度", "自我否定", "急功近利",
];

export interface SuggestAvoid {
  suggest: string[];
  avoid: string[];
}

export function generateSuggestAvoid(zodiac: string, dateStr?: string): SuggestAvoid {
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const seed = hashCode(`${today}-${zodiac}-badges`);
  const seed2 = hashCode(`${zodiac}-${today}-badges2`);

  const s1 = SUGGEST_TAGS[pickIndex(seed, SUGGEST_TAGS.length)];
  let s2 = SUGGEST_TAGS[pickIndex(seed2, SUGGEST_TAGS.length, 3)];
  if (s2 === s1) s2 = SUGGEST_TAGS[(SUGGEST_TAGS.indexOf(s1) + 1) % SUGGEST_TAGS.length];

  const a1 = AVOID_TAGS[pickIndex(seed, AVOID_TAGS.length, 7)];
  let a2 = AVOID_TAGS[pickIndex(seed2, AVOID_TAGS.length, 5)];
  if (a2 === a1) a2 = AVOID_TAGS[(AVOID_TAGS.indexOf(a1) + 1) % AVOID_TAGS.length];

  return { suggest: [s1, s2], avoid: [a1, a2] };
}

// ── Energy tasks with interactive state ──

const TASKS_STORAGE_KEY = "tarot_energy_tasks";

export interface EnergyTaskState {
  date: string;
  tasks: { id: number; icon: string; title: string; desc: string; done: boolean; tag: string }[];
}

const TASK_TAGS = ["突破", "人际", "仪式", "灵性", "健康", "创意", "内省", "行动"];

export function getTodayEnergyTasks(zodiac: string, dateStr?: string): EnergyTaskState {
  const today = dateStr || new Date().toISOString().slice(0, 10);

  // Try loading saved state for today
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const saved: EnergyTaskState = JSON.parse(raw);
      if (saved.date === today && saved.tasks.length > 0) return saved;
    }
  } catch {}

  // Generate fresh tasks for today
  const seed = hashCode(`${today}-${zodiac}-tasks`);
  const seed2 = hashCode(`${zodiac}-${today}-tasks2`);
  const indices = new Set<number>();
  while (indices.size < 4) {
    indices.add(pickIndex(indices.size === 0 ? seed : seed2 + indices.size, ENERGY_TASKS.length, indices.size * 3));
  }

  const tasks = Array.from(indices).map((idx, i) => ({
    id: i,
    icon: ENERGY_TASKS[idx].icon,
    title: ENERGY_TASKS[idx].title,
    desc: ENERGY_TASKS[idx].desc,
    done: false,
    tag: TASK_TAGS[pickIndex(seed + i, TASK_TAGS.length)],
  }));

  const state = { date: today, tasks };
  try { localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(state)); } catch {}
  return state;
}

export function toggleEnergyTask(taskId: number): EnergyTaskState | null {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return null;
    const state: EnergyTaskState = JSON.parse(raw);
    const task = state.tasks.find((t) => t.id === taskId);
    if (task) task.done = !task.done;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch { return null; }
}
