// ── MBTI & S/M personality tests ──

/* ─────────────────────────────────────────────
   MBTI — 16 questions (4 per dimension), 5-point scale
   ───────────────────────────────────────────── */

export interface MbtiQuestion {
  id: string;
  text: string;
  dimension: "EI" | "SN" | "TF" | "JP";
  poleA: string;  // E / S / T / J pole description
  poleB: string;  // I / N / F / P pole description
}

export const MBTI_LIKERT_OPTIONS = [
  { label: "完全符合A", value: 1 },
  { label: "偏向A", value: 2 },
  { label: "中立", value: 3 },
  { label: "偏向B", value: 4 },
  { label: "完全符合B", value: 5 },
];

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // ── E/I 维度 (4题) ──
  {
    id: "mbti-1", dimension: "EI",
    text: "周末你更倾向于怎样度过？",
    poleA: "参加聚会，和朋友们在一起让我精力充沛",
    poleB: "独自放松，独处或只和密友在一起让我恢复能量",
  },
  {
    id: "mbti-2", dimension: "EI",
    text: "在热闹的社交场合中，你通常会？",
    poleA: "主动与人攀谈，容易认识新朋友，话题切换自如",
    poleB: "倾向和少数人深入交流，先观察再慢慢融入",
  },
  {
    id: "mbti-3", dimension: "EI",
    text: "遇到问题时，你更偏向？",
    poleA: "先说出来，在与人讨论的过程中理清思路",
    poleB: "先自己想清楚，整理好思绪后再与他人分享",
  },
  {
    id: "mbti-4", dimension: "EI",
    text: "一天工作/学习后，你的充电方式是？",
    poleA: "约朋友出去走走或者聊聊天，互动让我回血",
    poleB: "关上房门看剧/读书/打游戏，一个人待着最舒服",
  },

  // ── S/N 维度 (4题) ──
  {
    id: "mbti-5", dimension: "SN",
    text: "你更信任哪种信息？",
    poleA: "亲身经历和已验证的事实，眼见为实",
    poleB: "内心的直觉和潜在的可能性，相信第六感",
  },
  {
    id: "mbti-6", dimension: "SN",
    text: "学习新事物时，你更喜欢？",
    poleA: "按步骤来，一步步掌握细节，注重实际操作",
    poleB: "先理解整体框架和概念，喜欢联想和类比",
  },
  {
    id: "mbti-7", dimension: "SN",
    text: "在阅读一本书或观看电影时，你更关注？",
    poleA: "具体的情节细节、人物关系和实际发生的事",
    poleB: "背后的主题寓意、象征手法和隐藏的可能性",
  },
  {
    id: "mbti-8", dimension: "SN",
    text: "当有人描述一个新想法时，你的第一反应是？",
    poleA: "它具体怎么落地？有没有实际操作方案？",
    poleB: "这个想法真有趣！它还能延伸出哪些可能？",
  },

  // ── T/F 维度 (4题) ──
  {
    id: "mbti-9", dimension: "TF",
    text: "做重要决定时，你更多依靠？",
    poleA: "逻辑分析，权衡利弊，以客观事实和数据为依据",
    poleB: "内心感受和价值观，考虑对人的影响和人际关系",
  },
  {
    id: "mbti-10", dimension: "TF",
    text: "朋友向你倾诉烦恼时，你倾向于？",
    poleA: "帮TA分析问题所在，直接给出解决建议和方案",
    poleB: "先共情和理解TA的感受，确认情绪后再讨论对策",
  },
  {
    id: "mbti-11", dimension: "TF",
    text: "在团队讨论中发生意见分歧时，你更看重？",
    poleA: "谁的观点逻辑更严密、论据更充分，就支持谁",
    poleB: "维护团队的和谐氛围，尽量避免伤害任何人的感受",
  },
  {
    id: "mbti-12", dimension: "TF",
    text: "评价一个人的工作时，你最先注意到？",
    poleA: "TA的工作成果是否达标，流程是否高效合理",
    poleB: "TA在过程中的付出和成长，以及团队的配合度",
  },

  // ── J/P 维度 (4题) ──
  {
    id: "mbti-13", dimension: "JP",
    text: "面对即将到来的假期，你更偏向？",
    poleA: "提前做好详细计划和预订，心里才踏实",
    poleB: "保留最大的灵活性，到时候看心情再说",
  },
  {
    id: "mbti-14", dimension: "JP",
    text: "完成一项任务时，你通常是？",
    poleA: "尽早开始，按计划逐步推进，不喜欢拖到最后一刻",
    poleB: "在截止日期前效率最高，享受最后冲刺的爆发力",
  },
  {
    id: "mbti-15", dimension: "JP",
    text: "你的桌面或工作空间通常是？",
    poleA: "整理得井井有条，每样东西都有固定的位置",
    poleB: "看起来有点乱，但我知道东西在哪，乱中有序",
  },
  {
    id: "mbti-16", dimension: "JP",
    text: "对于未来的生活，你更倾向于？",
    poleA: "设定清晰的阶段性目标，按照既定的方向稳步前进",
    poleB: "保持开放的心态，拥抱不确定性，随遇而安地探索",
  },
];

/* ── MBTI illustration data ── */

export interface MbtiIllustration {
  bgGradient: string;     // CSS gradient
  accentColor: string;    // primary highlight
  headShape: "round" | "oval" | "square" | "diamond";  // face contour
  eyeStyle: "round" | "almond" | "sharp" | "deep";     // eye shape
  mouthStyle: "smile" | "neutral" | "slight" | "open";  // mouth
  browStyle: "straight" | "arched" | "angled" | "soft"; // eyebrows
  shoulder: "broad" | "narrow" | "relaxed" | "lifted";  // posture
  decorColor: string;     // decorative element color
  decorShape: "stars" | "circles" | "triangles" | "waves" | "diamonds" | "lines";
}

/* ── MBTI 16 types ── */

export interface MbtiResult {
  type: string;
  typeName: string;
  group: string;
  groupEn: string;
  dimensions: { EI: string; SN: string; TF: string; JP: string };
  summary: string;
  traits: string[];
  strengths: string;
  weaknesses: string;
  career: string;
  zodiacMatch: string[];
  color: string;
  illustration: MbtiIllustration;
}

// Group color / decor presets
const NT_ILLUSTRATION: MbtiIllustration = {
  bgGradient: "linear-gradient(135deg, #1a0f2e 0%, #2d1b69 50%, #1a1040 100%)",
  accentColor: "#c084fc",
  headShape: "diamond", eyeStyle: "sharp", mouthStyle: "neutral", browStyle: "angled",
  shoulder: "broad", decorColor: "rgba(192,132,252,0.4)", decorShape: "triangles",
};
const NF_ILLUSTRATION: MbtiIllustration = {
  bgGradient: "linear-gradient(135deg, #1a0f2e 0%, #3b2a1a 50%, #1a1040 100%)",
  accentColor: "#d4a853",
  headShape: "oval", eyeStyle: "almond", mouthStyle: "smile", browStyle: "arched",
  shoulder: "relaxed", decorColor: "rgba(212,168,83,0.4)", decorShape: "stars",
};
const SJ_ILLUSTRATION: MbtiIllustration = {
  bgGradient: "linear-gradient(135deg, #1a0f2e 0%, #1a2a4a 50%, #1a1040 100%)",
  accentColor: "#60a5fa",
  headShape: "square", eyeStyle: "deep", mouthStyle: "slight", browStyle: "straight",
  shoulder: "broad", decorColor: "rgba(96,165,250,0.4)", decorShape: "lines",
};
const SP_ILLUSTRATION: MbtiIllustration = {
  bgGradient: "linear-gradient(135deg, #1a0f2e 0%, #3a1a1a 50%, #1a1040 100%)",
  accentColor: "#fb923c",
  headShape: "round", eyeStyle: "round", mouthStyle: "open", browStyle: "soft",
  shoulder: "lifted", decorColor: "rgba(251,146,60,0.4)", decorShape: "waves",
};

export const MBTI_TYPES: Record<string, MbtiResult> = {
  INTJ: {
    type: "INTJ", typeName: "建筑师", group: "分析师", groupEn: "Analysts",
    dimensions: { EI: "I 内向", SN: "N 直觉", TF: "T 思考", JP: "J 判断" },
    summary: "富有战略眼光的独立思考者，擅长制定长远计划并将构想变为现实。",
    traits: ["战略思维", "独立果断", "追求卓越", "冷静理性"],
    strengths: "强大的系统思维和规划能力，善于从复杂信息中提炼核心模式，执行力极强。",
    weaknesses: "有时显得过于严肃和距离感，对他人情绪不够敏感，完美主义倾向。",
    career: "科技研发、战略咨询、金融分析、工程设计、学术研究",
    zodiacMatch: ["摩羯座", "处女座", "天蝎座"],
    color: "#c084fc", illustration: { ...NT_ILLUSTRATION, headShape: "diamond", eyeStyle: "sharp", browStyle: "angled", mouthStyle: "neutral" },
  },
  INTP: {
    type: "INTP", typeName: "逻辑学家", group: "分析师", groupEn: "Analysts",
    dimensions: { EI: "I 内向", SN: "N 直觉", TF: "T 思考", JP: "P 感知" },
    summary: "思维缜密的理论探索者，对知识的渴望驱动着不断深挖事物本质。",
    traits: ["逻辑严密", "好奇心强", "独立思考", "创新精神"],
    strengths: "卓越的分析和抽象思维能力，能在复杂系统中发现隐藏规律。",
    weaknesses: "容易陷入过度分析而难以行动，社交场合可能显得心不在焉。",
    career: "编程开发、数据科学、哲学研究、游戏设计",
    zodiacMatch: ["水瓶座", "双子座", "天秤座"],
    color: "#c084fc", illustration: { ...NT_ILLUSTRATION, headShape: "oval", eyeStyle: "deep", browStyle: "straight", mouthStyle: "slight" },
  },
  ENTJ: {
    type: "ENTJ", typeName: "指挥官", group: "分析师", groupEn: "Analysts",
    dimensions: { EI: "E 外向", SN: "N 直觉", TF: "T 思考", JP: "J 判断" },
    summary: "天生的领导者，有远见且果断，善于组织和激励团队达成宏大目标。",
    traits: ["领导魄力", "远见卓识", "高效决断", "目标驱动"],
    strengths: "出色的组织和领导能力，勇于面对挑战，决策迅速且执行力强。",
    weaknesses: "有时过于强势和控制欲，对他人感受的关注不够，缺乏耐心。",
    career: "企业管理、创业、军事指挥、政界、投资银行",
    zodiacMatch: ["狮子座", "白羊座", "摩羯座"],
    color: "#c084fc", illustration: { ...NT_ILLUSTRATION, headShape: "square", eyeStyle: "sharp", browStyle: "angled", mouthStyle: "open" },
  },
  ENTP: {
    type: "ENTP", typeName: "辩论家", group: "分析师", groupEn: "Analysts",
    dimensions: { EI: "E 外向", SN: "N 直觉", TF: "T 思考", JP: "P 感知" },
    summary: "思维敏捷的创新者，享受智力挑战，善于从不同角度审视问题。",
    traits: ["机智善辩", "创意无限", "灵活应变", "知识广博"],
    strengths: "极强的即兴思维和创新能力，善于发现机会，沟通表达能力强。",
    weaknesses: "容易对常规任务感到厌倦，有时争论只是为了享受过程而非求结果。",
    career: "创业、市场营销、法律、媒体评论、产品设计",
    zodiacMatch: ["双子座", "水瓶座", "射手座"],
    color: "#c084fc", illustration: { ...NT_ILLUSTRATION, headShape: "round", eyeStyle: "almond", browStyle: "arched", mouthStyle: "smile" },
  },
  INFJ: {
    type: "INFJ", typeName: "提倡者", group: "外交官", groupEn: "Diplomats",
    dimensions: { EI: "I 内向", SN: "N 直觉", TF: "F 感受", JP: "J 判断" },
    summary: "深沉而富有洞察力的理想主义者，拥有强烈的使命感去帮助和启发他人。",
    traits: ["深度洞察", "温暖坚定", "理想主义", "富有远见"],
    strengths: "极强的共情能力和洞察力，善于理解他人深层需求，有坚定的价值观。",
    weaknesses: "容易过度付出而忽略自身需求，对批评敏感，完美主义带来的压力。",
    career: "心理咨询、教育、写作、非营利组织、艺术创作",
    zodiacMatch: ["双鱼座", "巨蟹座", "天蝎座"],
    color: "#d4a853", illustration: { ...NF_ILLUSTRATION, headShape: "oval", eyeStyle: "deep", browStyle: "soft", mouthStyle: "slight" },
  },
  INFP: {
    type: "INFP", typeName: "调停者", group: "外交官", groupEn: "Diplomats",
    dimensions: { EI: "I 内向", SN: "N 直觉", TF: "F 感受", JP: "P 感知" },
    summary: "内心丰富的诗意理想主义者，被核心价值观驱动，追寻生命的意义与美好。",
    traits: ["善良温暖", "创意十足", "忠于价值", "富有同情"],
    strengths: "深厚的同理心和创造力，忠于内心信念，善于发现和欣赏他人优点。",
    weaknesses: "有时过于理想化而脱离现实，难以面对冲突和批评，容易自我怀疑。",
    career: "写作、艺术、心理咨询、社会公益、设计",
    zodiacMatch: ["双鱼座", "巨蟹座", "天秤座"],
    color: "#d4a853", illustration: { ...NF_ILLUSTRATION, headShape: "round", eyeStyle: "almond", browStyle: "arched", mouthStyle: "smile" },
  },
  ENFJ: {
    type: "ENFJ", typeName: "主人公", group: "外交官", groupEn: "Diplomats",
    dimensions: { EI: "E 外向", SN: "N 直觉", TF: "F 感受", JP: "J 判断" },
    summary: "富有人格魅力的激励者，善于发掘他人潜能并引导团队走向共同愿景。",
    traits: ["感染力强", "善解人意", "领导魅力", "热情无私"],
    strengths: "出色的沟通和激励能力，善于建立深厚关系，组织协调能力强。",
    weaknesses: "有时过于在意他人看法而压抑自我，承担过多责任容易疲惫。",
    career: "教育、培训、人力资源、公关、政治",
    zodiacMatch: ["狮子座", "天秤座", "射手座"],
    color: "#d4a853", illustration: { ...NF_ILLUSTRATION, headShape: "oval", eyeStyle: "round", browStyle: "arched", mouthStyle: "smile" },
  },
  ENFP: {
    type: "ENFP", typeName: "竞选者", group: "外交官", groupEn: "Diplomats",
    dimensions: { EI: "E 外向", SN: "N 直觉", TF: "F 感受", JP: "P 感知" },
    summary: "充满热情的自由灵魂，对新事物永葆好奇，善于发现生活中的无限可能。",
    traits: ["热情洋溢", "创意迸发", "善于社交", "乐观自由"],
    strengths: "极强的社交和创新能力，热情感染身边人，灵活适应各种环境。",
    weaknesses: "容易分心和三分钟热度，难以拒绝他人，对琐碎细节缺乏耐心。",
    career: "创意策划、媒体传播、演艺、销售、旅行博主",
    zodiacMatch: ["射手座", "双子座", "白羊座"],
    color: "#d4a853", illustration: { ...NF_ILLUSTRATION, headShape: "round", eyeStyle: "round", browStyle: "soft", mouthStyle: "open" },
  },
  ISTJ: {
    type: "ISTJ", typeName: "物流师", group: "守护者", groupEn: "Sentinels",
    dimensions: { EI: "I 内向", SN: "S 实际", TF: "T 思考", JP: "J 判断" },
    summary: "稳重可靠的责任担当者，以严谨务实的态度把每件事做到极致。",
    traits: ["踏实可靠", "严谨细致", "责任心强", "循规守序"],
    strengths: "极强的执行力和自律性，做事有条不紊，承诺的事情一定做到。",
    weaknesses: "对新变化适应较慢，有时过于固执己见，不善于表达情感。",
    career: "会计审计、行政管理、军事、工程管理、医疗",
    zodiacMatch: ["金牛座", "处女座", "摩羯座"],
    color: "#60a5fa", illustration: { ...SJ_ILLUSTRATION, headShape: "square", eyeStyle: "deep", browStyle: "straight", mouthStyle: "neutral" },
  },
  ISFJ: {
    type: "ISFJ", typeName: "守卫者", group: "守护者", groupEn: "Sentinels",
    dimensions: { EI: "I 内向", SN: "S 实际", TF: "F 感受", JP: "J 判断" },
    summary: "默默奉献的温暖守护者，用细腻的关怀和实际行动守护身边每一个人。",
    traits: ["温柔细腻", "忠诚可靠", "无私奉献", "务实细心"],
    strengths: "极强的责任感和同理心，对细节的关注让工作品质出众，忠诚可靠。",
    weaknesses: "容易过度付出而忽略自己，不善于拒绝，对变化感到不安。",
    career: "护理医疗、教育、社工、行政管理、手工艺",
    zodiacMatch: ["巨蟹座", "金牛座", "处女座"],
    color: "#60a5fa", illustration: { ...SJ_ILLUSTRATION, headShape: "round", eyeStyle: "almond", browStyle: "soft", mouthStyle: "slight" },
  },
  ESTJ: {
    type: "ESTJ", typeName: "总经理", group: "守护者", groupEn: "Sentinels",
    dimensions: { EI: "E 外向", SN: "S 实际", TF: "T 思考", JP: "J 判断" },
    summary: "高效务实的管理者，以清晰的目标和强大的组织力推动事务高效运转。",
    traits: ["高效务实", "组织力强", "果断决绝", "坚持原则"],
    strengths: "出色的组织和管理能力，决策果断，执行力强，遵守承诺和规则。",
    weaknesses: "有时显得过于严厉和缺乏弹性，对非传统观点接受度低。",
    career: "项目管理、军事指挥、企业高管、法律、执法",
    zodiacMatch: ["摩羯座", "白羊座", "狮子座"],
    color: "#60a5fa", illustration: { ...SJ_ILLUSTRATION, headShape: "square", eyeStyle: "sharp", browStyle: "straight", mouthStyle: "open" },
  },
  ESFJ: {
    type: "ESFJ", typeName: "执政官", group: "守护者", groupEn: "Sentinels",
    dimensions: { EI: "E 外向", SN: "S 实际", TF: "F 感受", JP: "J 判断" },
    summary: "热情周到的社交核心，用温暖和关怀营造和谐融洽的人际氛围。",
    traits: ["热情周到", "善于社交", "乐于助人", "注重和谐"],
    strengths: "极强的人际交往和协调能力，细心周到，善于营造温暖氛围。",
    weaknesses: "对批评过度敏感，过于在意他人看法，有时难以为自己发声。",
    career: "教育、医疗、客服、活动策划、社区管理",
    zodiacMatch: ["天秤座", "巨蟹座", "金牛座"],
    color: "#60a5fa", illustration: { ...SJ_ILLUSTRATION, headShape: "oval", eyeStyle: "round", browStyle: "arched", mouthStyle: "smile" },
  },
  ISTP: {
    type: "ISTP", typeName: "鉴赏家", group: "探险家", groupEn: "Explorers",
    dimensions: { EI: "I 内向", SN: "S 实际", TF: "T 思考", JP: "P 感知" },
    summary: "冷静沉稳的实干技术派，享受用双手拆解和探索事物运作原理的乐趣。",
    traits: ["冷静务实", "动手能力强", "善解难题", "独立自由"],
    strengths: "出色的问题解决和动手能力，在危机中保持冷静，灵活适应。",
    weaknesses: "对情感话题回避，不喜欢长期规划，有时过于冒险。",
    career: "工程师、飞行员、法医、机械维修、户外教练",
    zodiacMatch: ["射手座", "水瓶座", "白羊座"],
    color: "#fb923c", illustration: { ...SP_ILLUSTRATION, headShape: "square", eyeStyle: "sharp", browStyle: "straight", mouthStyle: "neutral" },
  },
  ISFP: {
    type: "ISFP", typeName: "探险家", group: "探险家", groupEn: "Explorers",
    dimensions: { EI: "I 内向", SN: "S 实际", TF: "F 感受", JP: "P 感知" },
    summary: "天性自由的美学探索者，用独特审美和敏锐感官体验世界的细微之美。",
    traits: ["审美敏锐", "随性自由", "温柔低调", "热爱生活"],
    strengths: "强烈的审美意识和创造力，善于发现生活中的美，待人真诚温暖。",
    weaknesses: "对未来缺乏规划，回避冲突，有时过于内向而错失机会。",
    career: "设计师、摄影师、音乐人、花艺师、美容造型",
    zodiacMatch: ["双鱼座", "天秤座", "金牛座"],
    color: "#fb923c", illustration: { ...SP_ILLUSTRATION, headShape: "oval", eyeStyle: "almond", browStyle: "soft", mouthStyle: "slight" },
  },
  ESTP: {
    type: "ESTP", typeName: "企业家", group: "探险家", groupEn: "Explorers",
    dimensions: { EI: "E 外向", SN: "S 实际", TF: "T 思考", JP: "P 感知" },
    summary: "精明务实的行动派，享受冒险和挑战，在瞬息万变的环境中如鱼得水。",
    traits: ["大胆果断", "随机应变", "现实务实", "魅力十足"],
    strengths: "极强的临场应变和说服能力，敢想敢做，善于抓住即刻的机会。",
    weaknesses: "有时过于冒险和冲动，对长期规划和抽象理论缺乏耐心。",
    career: "销售、体育竞技、急救服务、演艺、创业",
    zodiacMatch: ["白羊座", "狮子座", "射手座"],
    color: "#fb923c", illustration: { ...SP_ILLUSTRATION, headShape: "square", eyeStyle: "sharp", browStyle: "angled", mouthStyle: "open" },
  },
  ESFP: {
    type: "ESFP", typeName: "表演者", group: "探险家", groupEn: "Explorers",
    dimensions: { EI: "E 外向", SN: "S 实际", TF: "F 感受", JP: "P 感知" },
    summary: "自带光芒的快乐传播者，用热情和活力把每一天都变成难忘的派对。",
    traits: ["活力四射", "善于社交", "享受当下", "乐天达观"],
    strengths: "极强的感染力和即兴表现力，善于营造欢乐氛围，待人热情真诚。",
    weaknesses: "容易分心，对长期规划不足，有时过度追求新鲜刺激。",
    career: "演艺、主持、销售、旅游、餐饮娱乐",
    zodiacMatch: ["狮子座", "双子座", "天秤座"],
    color: "#fb923c", illustration: { ...SP_ILLUSTRATION, headShape: "round", eyeStyle: "round", browStyle: "arched", mouthStyle: "smile" },
  },
};

/* ── MBTI scoring (5-point Likert: 1=poleA, 5=poleB) ── */

export function calcMbti(answers: Map<string, number>): MbtiResult {
  const dimScores: Record<string, number[]> = { EI: [], SN: [], TF: [], JP: [] };
  for (const q of MBTI_QUESTIONS) {
    const val = answers.get(q.id);
    if (val != null) dimScores[q.dimension].push(val);
  }
  const dims: Record<string, number> = {};
  for (const d of ["EI", "SN", "TF", "JP"] as const) {
    const scores = dimScores[d];
    if (scores.length === 0) { dims[d] = 3; continue; }
    dims[d] = scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  // avg < 3 → poleA (E/S/T/J), avg >= 3 → poleB (I/N/F/P)
  const type = [
    dims.EI >= 3 ? "I" : "E",
    dims.SN >= 3 ? "N" : "S",
    dims.TF >= 3 ? "F" : "T",
    dims.JP >= 3 ? "P" : "J",
  ].join("");
  return MBTI_TYPES[type];
}

/* ─────────────────────────────────────────────
   S/M — 12 questions (2 per 6 types)
   ───────────────────────────────────────────── */

export interface SmQuestion {
  id: string;
  text: string;
  type: "dominant" | "submissive" | "sadist" | "masochist" | "switch" | "vanilla";
}

export const SM_QUESTIONS: SmQuestion[] = [
  // Dominant
  { id: "sm-1", type: "dominant", text: "在团队或关系中，你倾向于主动拍板做决定" },
  { id: "sm-2", type: "dominant", text: "你享受掌控全局、引导事情往自己期望方向发展的感觉" },
  // Submissive
  { id: "sm-3", type: "submissive", text: "你乐于把决定权交给信任的人，配合对方的节奏" },
  { id: "sm-4", type: "submissive", text: "你更享受跟随和配合，而不是自己主导一切" },
  // Sadist
  { id: "sm-5", type: "sadist", text: "在某些情境中，掌控他人情绪或行为会让你感到满足" },
  { id: "sm-6", type: "sadist", text: "你有时享受对他人施加适度压力来获得掌控感" },
  // Masochist
  { id: "sm-7", type: "masochist", text: "在特定情境下，你愿意接受他人的主导或适度管教" },
  { id: "sm-8", type: "masochist", text: "承受一些挑战或压力反而让你感到兴奋和投入" },
  // Switch
  { id: "sm-9", type: "switch", text: "你在不同场合或关系中，倾向的角色会明显不同" },
  { id: "sm-10", type: "switch", text: "你既可以扮演掌控方，也可以在适当时候转换成为配合方" },
  // Vanilla
  { id: "sm-11", type: "vanilla", text: "你对权力交换或强弱角色扮演不太感兴趣" },
  { id: "sm-12", type: "vanilla", text: "你更偏好平等、温和、传统的相处方式" },
];

export const SM_LIKERT_OPTIONS = [
  { label: "完全不符", value: 1 },
  { label: "不太符合", value: 2 },
  { label: "一半一半", value: 3 },
  { label: "比较符合", value: 4 },
  { label: "完全符合", value: 5 },
];

export interface SmTypeScore {
  type: string;
  en: string;
  icon: string;
  score: number;
  color: string;
  description: string;
}

export interface SmResult {
  types: SmTypeScore[];
  primaryType: SmTypeScore;
  secondaryType: SmTypeScore;
  summary: string;
  traits: string[];
  relationshipTip: string;
  dirtyTalk: string[];   // 2-3 provocative phrases
  sweetTalk: string[];   // 2-3 tender phrases
}

const SM_TYPE_META: Record<string, { type: string; en: string; icon: string; color: string; description: string }> = {
  dominant:   { type: "支配者", en: "Dominant", icon: "👑", color: "#f87171", description: "天然的主导者，享受掌控感和决策权" },
  submissive: { type: "服从者", en: "Submissive", icon: "🕊️", color: "#60a5fa", description: "愿意交出控制权，在配合中找到舒适感" },
  sadist:     { type: "施虐者", en: "Sadist", icon: "🔥", color: "#fbbf24", description: "从掌控和施压中获得心理满足" },
  masochist:  { type: "受虐者", en: "Masochist", icon: "🌙", color: "#c084fc", description: "享受承受和服从带来的独特体验" },
  switch:     { type: "双面者", en: "Switch", icon: "🔄", color: "#34d399", description: "灵活切换角色，适应不同情境和关系" },
  vanilla:    { type: "普通型", en: "Vanilla", icon: "🌸", color: "#f9a8d4", description: "偏好平等温和的相处模式，不涉权力交换" },
};

export function calcSm(answers: Map<string, number>): SmResult {
  const raw: Record<string, number> = {};
  const count: Record<string, number> = {};
  for (const q of SM_QUESTIONS) {
    const val = answers.get(q.id) ?? 3;
    raw[q.type] = (raw[q.type] || 0) + val;
    count[q.type] = (count[q.type] || 0) + 1;
  }
  // Normalize to 0-100 per type
  const types: SmTypeScore[] = Object.entries(raw).map(([key, total]) => {
    const max = (count[key] || 2) * 5;
    const min = (count[key] || 2) * 1;
    const pct = Math.round(((total - min) / (max - min)) * 100);
    const meta = SM_TYPE_META[key];
    return { ...meta, score: Math.max(0, Math.min(100, pct)) };
  });
  types.sort((a, b) => b.score - a.score);

  const primary = types[0];
  const secondary = types[1];

  // Generate summary from top 2 types
  const summaries: Record<string, string> = {
    dominant: "你天生具有主导倾向，在关系中喜欢掌控节奏和方向。",
    submissive: "你更享受服从和配合，在交出控制权时感到自在舒适。",
    sadist: "你有一定的施虐倾向，从掌控他人中获得心理满足。",
    masochist: "你有受虐倾向，能在承受压力中找到独特的愉悦。",
    switch: "你是一个灵活多变的人，能根据情境自由切换角色。",
    vanilla: "你偏好传统温和的相处模式，不热衷于权力角色扮演。",
  };

  const tips: Record<string, string> = {
    "dominant-submissive": "你与服从者天然互补，彼此的需求恰好吻合，是理想的契合搭配。",
    "submissive-dominant": "你与支配者形成自然的互补关系，能在对方的引导下找到安心感。",
    "sadist-masochist": "你与受虐者高度契合，权力交换的张力让你们的关系充满火花。",
    "masochist-sadist": "你与施虐者在心理层面形成独特的共振，彼此满足对方深层需求。",
    "switch-switch": "双面者遇上双面者，你们能创造出无限的角色变化和新鲜感。",
    default: "你的倾向组合较为独特，建议在关系中坦诚沟通各自的偏好和边界。",
  };

  const tipKey = `${primary.en.toLowerCase()}-${secondary.en.toLowerCase()}`;
  const relationshipTip = tips[tipKey] || tips["default"];

  // Dirty Talk & Sweet Talk based on primary type
  const dirtyTalkMap: Record<string, string[]> = {
    Dominant: [
      "今晚听我的，别问为什么，只管服从",
      "看着我的眼睛，不许躲开，我要你记住这一刻",
      "乖乖在我掌控之下，你越挣扎我越兴奋",
    ],
    Submissive: [
      "请告诉我该怎么做，我会一字不漏地执行",
      "我把自己交给你了，你想怎么处置都可以",
      "求你别这么温柔，我想要更强势一点的你",
    ],
    Sadist: [
      "你喜欢这样对吗，嘴上说不要身体却很诚实",
      "别忍着，让我听到你的声音，不然我会更过分",
      "每次看你求饶的样子，我就更想欺负你了",
    ],
    Masochist: [
      "请你再严厉一点，我承受得起的",
      "被你支配的每一秒都让人上瘾，别停",
      "我就喜欢你这种不容反抗的气势，让我心甘情愿",
    ],
    Switch: [
      "今天你是我的，明天轮到你来惩罚我",
      "这次换你主导，让我看看你有多想掌控我",
      "我们轮流掌控节奏吧，谁先求饶就听对方的",
    ],
    Vanilla: [
      "我不需要什么角色扮演，就这样抱着你已经足够",
      "温柔一点就好，我只想好好感受你的存在",
      "比起那些刺激的玩法，你的一句情话更能让我沦陷",
    ],
  };

  const sweetTalkMap: Record<string, string[]> = {
    Dominant: [
      "不必一直撑着，在我这里你可以卸下所有防备",
      "掌控久了也会累，今晚让我照顾你的一切",
      "我只想把你护在身后，不让这世界伤你分毫",
    ],
    Submissive: [
      "你的信任是我最珍贵的礼物，我绝不会辜负",
      "在你面前做真实的自己，是我一天中最幸福的时刻",
      "我不需要做什么伟大的事，只要能在你身边就已经足够",
    ],
    Sadist: [
      "霸气只是我的保护色，在你面前我只想温柔以待",
      "我的严厉都是为了你好，因为我在乎你到骨子里",
      "对外人我可以冷血到底，唯独对你狠不下心",
    ],
    Masochist: [
      "你以为我在忍受，其实我只是在享受被你珍视的感觉",
      "被你管束的每一天，都在提醒我我是被人爱着的",
      "不需要刻意温柔，你本来的样子就已让我深陷其中",
    ],
    Switch: [
      "在不同角色间切换，唯一不变的是我想和你在一起的心",
      "你让我的每一天都充满未知的惊喜和期待",
      "不管今天谁来主导，最后相拥入眠的样子就是答案",
    ],
    Vanilla: [
      "平淡的陪伴才是最奢侈的浪漫，谢谢你的每一个日常",
      "我爱的不是刺激和新奇，而是与你相伴的每一刻真实",
      "简单的早安晚安，就足够填满我对爱情的所有想象",
    ],
  };

  const dirtyTalk = dirtyTalkMap[primary.en] || dirtyTalkMap.Vanilla;
  const sweetTalk = sweetTalkMap[primary.en] || sweetTalkMap.Vanilla;

  return {
    types,
    primaryType: primary,
    secondaryType: secondary,
    summary: summaries[Object.keys(SM_TYPE_META).find(k => SM_TYPE_META[k].en === primary.en) || "vanilla"],
    traits: [
      `${primary.type}倾向明显`,
      `兼具${secondary.type}特质`,
      types[2].score > 50 ? `带有${types[2].type}色彩` : "核心倾向集中",
    ],
    relationshipTip,
    dirtyTalk,
    sweetTalk,
  };
}

/* ─────────────────────────────────────────────
   localStorage persistence
   ───────────────────────────────────────────── */

const MBTI_KEY = "tarot_mbti_result";
const SM_KEY = "tarot_sm_result";

export function saveMbtiResult(result: MbtiResult): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(MBTI_KEY, JSON.stringify(result)); } catch {}
}

export function getMbtiResult(): MbtiResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MBTI_KEY);
    return raw ? JSON.parse(raw) as MbtiResult : null;
  } catch { return null; }
}

export function hasMbtiResult(): boolean {
  return getMbtiResult() !== null;
}

export function saveSmResult(result: SmResult): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SM_KEY, JSON.stringify(result)); } catch {}
}

export function getSmResult(): SmResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SM_KEY);
    return raw ? JSON.parse(raw) as SmResult : null;
  } catch { return null; }
}

export function hasSmResult(): boolean {
  return getSmResult() !== null;
}

/* ─────────────────────────────────────────────
   Backend sync
   ───────────────────────────────────────────── */

export function getPersonalityPayload(): {
  mbti_type?: string;
  sm_type?: string;
  sm_scores?: string;
} {
  const mbti = getMbtiResult();
  const sm = getSmResult();
  const payload: Record<string, string> = {};
  if (mbti) {
    payload.mbti_type = `${mbti.type}|${mbti.typeName}|${mbti.color}`;
  }
  if (sm) {
    payload.sm_type = `${sm.primaryType.en}|${sm.primaryType.type}`;
    payload.sm_scores = JSON.stringify(sm.types.map(t => ({
      type: t.en, score: t.score,
    })));
  }
  return payload;
}
