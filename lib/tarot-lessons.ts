export interface Lesson {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
}

export interface LessonModule {
  id: string;
  title: string;
  icon: string;
  description: string;
  lessons: Lesson[];
}

export const TAROT_MODULES: LessonModule[] = [
  {
    id: "basics",
    title: "塔罗基础",
    icon: "📖",
    description: "了解塔罗牌的历史、结构与基本使用方法",
    lessons: [
      {
        id: "basics-1",
        title: "塔罗牌的起源与结构",
        content: `塔罗牌起源于15世纪的意大利，最初是一种纸牌游戏，后来演变为占卜工具。一副标准塔罗牌共78张，分为两大部分：

大阿卡纳（Major Arcana）：22张，从"愚者"到"世界"，代表人生的重要课题和精神成长旅程。

小阿卡纳（Minor Arcana）：56张，分为四个牌组——权杖（火）、圣杯（水）、宝剑（风）、星币（土）。每个牌组包含10张数字牌和4张宫廷牌（侍从、骑士、皇后、国王）。

每张牌都有正位和逆位两种含义，正位代表能量的顺畅流动，逆位代表能量的阻碍或内在化。`,
        keyPoints: ["78张牌 = 22张大阿卡纳 + 56张小阿卡纳", "四个牌组对应四大元素", "正位与逆位的基础概念"],
      },
      {
        id: "basics-2",
        title: "如何选择与净化塔罗牌",
        content: `选择一副与你产生共鸣的塔罗牌非常重要。当你第一次看到牌面图案时，如果有"就是它了"的感觉，那就是适合你的牌。

净化塔罗牌的常用方法：
1. 月光净化：将牌放在窗台，让满月或新月的月光照射一晚
2. 水晶净化：将牌与白水晶或紫水晶放在一起
3. 冥想净化：手持牌组，闭眼深呼吸，想象白光清洗每张牌
4. 敲击法：用手指轻轻敲击牌组三次，震落附着的能量

建议在每次占卜前简单净化，每月满月时做一次深度净化。`,
        keyPoints: ["选择有共鸣的牌", "四种净化方法", "定期维护牌的能量"],
      },
      {
        id: "basics-3",
        title: "提问的艺术",
        content: `塔罗牌回应的是你的潜意识和宇宙能量，提问方式直接影响解读质量。

好问题的特征：
- 开放性（不用是/否）："我在这段关系中学到了什么？"
- 聚焦自己："我如何提升工作效率？"
- 行动导向："接下来三个月我应该关注什么？"

避免的问题：
- "他/她爱不爱我？"（建议改为"我在这段关系中需要了解什么？"）
- "我什么时候会发财？"（建议改为"我如何改善财务状况？"）
- 过度依赖他人的问题

在抽牌前，深呼吸，将问题清晰地默念三遍。`,
        keyPoints: ["开放性问题优于是非题", "聚焦自己而非猜测他人", "行动导向而非被动等待"],
      },
      {
        id: "basics-4",
        title: "洗牌、切牌与抽牌仪式",
        content: `标准的塔罗占卜仪式分为三个步骤：

1. 洗牌：将牌面向下，用你习惯的方式洗牌。可以像洗扑克牌一样交错洗，也可以将牌铺在桌面上打圈混合。洗牌时默念你的问题。

2. 切牌：洗好后将牌组放在面前，用左手（接收能量的手）将牌分成三叠，然后按直觉重新叠成一叠。

3. 抽牌：根据牌阵要求，从牌组中依次抽出所需张数。可以用"扇形展开法"——将牌在桌面扇形展开，凭直觉逐一抽取。

整个过程保持平静、专注的心态。如果心情烦躁，建议先冥想5分钟再开始。`,
        keyPoints: ["洗牌时默念问题", "用左手切牌（接收能量）", "扇形展开凭直觉抽牌"],
      },
    ],
  },
  {
    id: "major-arcana",
    title: "大阿卡纳之旅",
    icon: "🌟",
    description: "22张大牌的深层含义与愚者之旅",
    lessons: [
      {
        id: "major-1",
        title: "愚者之旅：大阿卡纳的三阶段",
        content: `22张大阿卡纳讲述了一个完整的精神成长旅程，被称为"愚者之旅"。

第一阶段（愚者→战车）：意识觉醒
愚者从零开始，经历魔法师的学习、女祭司的直觉、皇后的滋养、皇帝的秩序、教宗的信仰、恋人的选择，最终在战车中获得了掌控力。这一阶段代表从无知到自我意识的觉醒。

第二阶段（力量→节制）：灵魂试炼
力量教会我们内在的勇气，隐者引导我们内省，命运之轮带来转折，正义要求平衡，倒吊人让我们换角度看世界，死神带来蜕变，节制教会我们调和。这是灵魂成长的试炼阶段。

第三阶段（恶魔→世界）：精神升华
恶魔揭示欲望的束缚，高塔打破旧有结构，星星带来希望，月亮面对恐惧，太阳绽放光芒，审判实现觉醒，世界完成圆满。`,
        keyPoints: ["第一阶段：意识觉醒（愚者→战车）", "第二阶段：灵魂试炼（力量→节制）", "第三阶段：精神升华（恶魔→世界）"],
      },
      {
        id: "major-2",
        title: "核心大牌精讲（上）",
        content: `愚者：编号0，代表新的开始、冒险、无限可能。正位时是勇敢踏上新征程；逆位时是鲁莽、不顾后果。

魔法师：编号1，代表创造力、技能、意志力。正位时你拥有实现目标的所有资源；逆位时是能力未发挥或欺骗。

女祭司：编号2，代表直觉、潜意识、神秘智慧。正位时相信内在声音；逆位时是被表面蒙蔽。

皇后：编号3，代表丰盛、母性、感官享受。正位时收获与滋养；逆位时是过度依赖或创造力的阻塞。

皇帝：编号4，代表权威、结构、稳定。正位时是建立秩序的好时机；逆位时是专制或缺乏纪律。`,
        keyPoints: ["愚者=新的开始", "魔法师=创造力与行动", "女祭司=直觉与内在智慧", "皇后=丰盛与滋养", "皇帝=秩序与权威"],
      },
      {
        id: "major-3",
        title: "核心大牌精讲（下）",
        content: `恋人：编号6，代表选择、爱、价值观的合一。正位时是真诚的关系和重要抉择；逆位时是价值观冲突或分离。

死神：编号13，代表结束与重生，不一定是肉体的死亡。正位时旧的事物必须结束才能迎来新生；逆位时是抗拒改变。

高塔：编号16，代表突然的倒塌与觉醒。正位时是旧有结构的崩塌，虽然痛苦但是必要的；逆位时是逃避改变或危机延迟。

星星：编号17，代表希望、治愈、灵感。正位时黑暗已过，光明在前；逆位时是失望或信念动摇。

世界：编号21，代表完成、圆满、整合。正位时一个周期的圆满结束；逆位时是未完成或延迟的成功。`,
        keyPoints: ["恋人是重要的选择", "死神是结束→重生", "高塔是崩塌→觉醒", "星星是希望与治愈", "世界是圆满与完成"],
      },
    ],
  },
  {
    id: "minor-arcana",
    title: "小阿卡纳解读",
    icon: "🎴",
    description: "四元素牌组的含义与数字牌解读技巧",
    lessons: [
      {
        id: "minor-1",
        title: "四元素与四个牌组",
        content: `小阿卡纳的四个牌组对应四大元素，每个牌组有不同的生活领域：

权杖（火元素 🔥）：行动力、热情、事业、创造力。权杖牌指向你的行动方向和能量投入。火元素代表快速、主动、外向的能量。

圣杯（水元素 💧）：情感、关系、直觉、灵性。圣杯牌揭示你的情感世界和人际关系。水元素代表流动、深层、感性的能量。

宝剑（风元素 🌬️）：思维、沟通、决策、挑战。宝剑牌反映你的心智状态和面临的困难。风元素代表理智、快速、有时锋利的能量。

星币（土元素 🌍）：物质、财富、健康、稳定。星币牌涉及你的实际生活和物质基础。土元素代表稳定、缓慢、务实的能量。

理解四元素能帮你快速判断牌的核心领域，再结合数字含义进一步细化解读。`,
        keyPoints: ["权杖=火=行动与事业", "圣杯=水=情感与关系", "宝剑=风=思维与挑战", "星币=土=物质与稳定"],
      },
      {
        id: "minor-2",
        title: "数字牌的含义规律",
        content: `每个牌组的数字牌从1到10，遵循相似的成长轨迹：

王牌(1)：新的开始，纯粹的元素能量
2号牌：二元性，选择，平衡，伙伴关系
3号牌：创造，扩张，初步成果
4号牌：稳定，基础，暂时的停滞
5号牌：冲突，变化，挑战与突破
6号牌：和谐，恢复，分享与给予
7号牌：反思，评估，内在探索
8号牌：行动，进展，动能增强
9号牌：接近完成，收获，智慧的积累
10号牌：完成，新的循环开始

掌握这个规律后，解读任何数字牌都有一个基本的框架。结合牌组的元素属性，就能快速理解牌意。`,
        keyPoints: ["王牌=新开始", "5号=冲突与变化", "10号=完成与新循环", "数字递进反映事物发展规律"],
      },
      {
        id: "minor-3",
        title: "宫廷牌：人格的16面",
        content: `每个牌组有4张宫廷牌：侍从、骑士、皇后、国王。它们可以代表你生活中的人，也可以代表你自身人格的不同面向。

侍从（Page）：初学者心态，好奇心，新的学习。年轻、不成熟但充满潜力。

骑士（Knight）：行动、追求、冒险。积极主动但有时冲动。骑士在"做"的阶段。

皇后（Queen）：内在成熟，滋养力，掌控内在世界。皇后是"存在"的智慧，而非"做"。

国王（King）：外在权威，掌控力，领导才能。国王已经掌握了该元素的所有面向。

宫廷牌也代表元素之间的组合：侍从=土、骑士=火、皇后=水、国王=风。`,
        keyPoints: ["侍从=学习与好奇", "骑士=行动与追求", "皇后=内在成熟", "国王=外在掌控", "宫廷牌既可指人也可指人格"],
      },
    ],
  },
  {
    id: "spreads",
    title: "牌阵入门",
    icon: "📐",
    description: "常用牌阵的摆法与解读逻辑",
    lessons: [
      {
        id: "spreads-1",
        title: "三张牌阵：过去·现在·未来",
        content: `三张牌阵是最经典、最灵活的牌阵之一。左中右三张牌分别代表：

左（过去）：影响当前情况的历史因素
中（现在）：当前的核心状况
右（未来）：事态发展的可能方向

解读技巧：
- 先单独看每张牌的含义
- 再寻找三张牌之间的联系（元素、数字、主题）
- 注意牌面人物的朝向（面朝左=回顾过去，面朝右=展望未来）
- 最后的"未来"牌不是宿命，而是趋势

三张牌阵几乎适用于任何问题，是初学者最佳起点。`,
        keyPoints: ["左=过去 · 中=现在 · 右=未来", "先单看再找联系", "未来牌是趋势而非宿命"],
      },
      {
        id: "spreads-2",
        title: "凯尔特十字牌阵（10张）",
        content: `凯尔特十字是塔罗最著名的牌阵，用于深度分析。

位置含义：
1. 核心——当前问题的核心
2. 交叉——阻碍或加强的因素
3. 基础——潜意识的根源
4. 过去——近期的影响
5. 目标——理想与期待
6. 近未来——即将到来的影响
7. 你的态度——你如何看待此事
8. 环境——外部因素与他人的影响
9. 希望与恐惧——内心的矛盾
10. 结果——事态的可能走向

解读顺序：先读1+2交叉的核心矛盾，再纵向读3-6的时间线，最后横向读7-10的全景。`,
        keyPoints: ["1+2交叉=核心矛盾", "3-6纵向=时间线", "7-10横向=全景", "适合深度分析复杂问题"],
      },
      {
        id: "spreads-3",
        title: "关系牌阵与是否牌阵",
        content: `关系牌阵（7张）：
左边3张代表你，右边3张代表对方，中间1张是关系核心。适合分析恋爱、友情、合作关系。

解读时注意：
- 对比左右两边的元素平衡
- 中间牌是双方共同的课题
- 宫廷牌可能直接代表对方

是/否牌阵（5张）：
一字排开5张牌。3张以上正位/积极牌 → 倾向"是"。综合看元素的流畅度，而非简单计数。

牌越多，解读越需要综合判断，而非单张牌的字面含义。`,
        keyPoints: ["关系牌阵=你3+对方3+核心1", "是否牌阵看正位比例和元素流畅度", "综合判断优于单张解读"],
      },
    ],
  },
  {
    id: "reversals",
    title: "逆位解读",
    icon: "🔄",
    description: "逆位牌的多种解读方法与实用技巧",
    lessons: [
      {
        id: "reversals-1",
        title: "逆位的五种解读方式",
        content: `逆位牌不一定是"坏牌"。以下是五种解读逆位的方法：

1. 能量阻塞：正位的能量被阻碍或无法顺畅表达。如权杖ACE逆位=行动受阻、创意卡壳。

2. 内在化：外在表现的能量转为内在体验。如宝剑3逆位=悲伤不是来自外部，而是内心无法释怀。

3. 过度或不足：正位的特质走向极端或完全缺失。如皇后逆位=要么过度溺爱，要么完全忽视自我。

4. 延迟：正位预示的事件被推迟。如世界逆位=成功会到来，但比预期更晚。

5. 需要疗愈：逆位指出需要特别关注的领域。如圣杯5逆位=需要放下过去，开始情感疗愈。

初学者建议先用方法1和2，熟练后再综合运用。`,
        keyPoints: ["能量阻塞（最常用）", "内在化（外转内）", "过度或不足", "延迟而非取消", "指出需要疗愈处"],
      },
      {
        id: "reversals-2",
        title: "逆位解牌实战技巧",
        content: `解读逆位牌的实用步骤：

1. 先读正位含义，再想"如果这个能量反过来了会怎样？"
2. 结合牌阵中相邻牌的正位/逆位比例：如果大部分牌都是正位，单张逆位可能只是一个小的提醒；如果多张逆位，说明整体能量需要调整
3. 注意逆位牌的"邀请"：逆位不是惩罚，而是邀请你关注某个被忽视的领域
4. 提供正向建议：解读逆位时要给出"如何调整"的建议，而非只描述问题

举例：逆位的力量牌 → "你可能正在压抑自己的力量，或过度控制。试着相信你内心的温柔力量，而非强迫自己硬撑。"`,
        keyPoints: ["先正位再反转去思考", "参考整体逆位比例", "逆位是邀请而非惩罚", "给出调整建议"],
      },
    ],
  },
];

// Progress tracking — localStorage cache + server sync
const PROGRESS_KEY = "tarot_lesson_progress";

export function getLessonProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function setLessonProgress(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...ids]));
}

export async function markLessonComplete(lessonId: string): Promise<Set<string>> {
  const progress = getLessonProgress();
  progress.add(lessonId);
  setLessonProgress(progress);
  // Sync to server
  await syncProgressToServer([...progress]);
  return progress;
}

export function isLessonComplete(lessonId: string): boolean {
  return getLessonProgress().has(lessonId);
}

async function syncProgressToServer(ids: string[]) {
  try {
    const token = localStorage.getItem("tarot_token");
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    await fetch(`${base}/api/auth/me/lessons/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lesson_ids: ids }),
    });
  } catch {}
}

export async function loadProgressFromServer(): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set();
  try {
    const token = localStorage.getItem("tarot_token");
    if (!token) return getLessonProgress();
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${base}/api/auth/me/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getLessonProgress();
    const data = await res.json();
    const serverIds = new Set<string>(data.lesson_ids || []);
    // Merge server progress with local
    const local = getLessonProgress();
    const merged = new Set([...serverIds, ...local]);
    setLessonProgress(merged);
    return merged;
  } catch {
    return getLessonProgress();
  }
}

export function getModuleProgress(moduleId: string): { completed: number; total: number } {
  const mod = TAROT_MODULES.find(m => m.id === moduleId);
  if (!mod) return { completed: 0, total: 0 };
  const progress = getLessonProgress();
  const completed = mod.lessons.filter(l => progress.has(l.id)).length;
  return { completed, total: mod.lessons.length };
}

export function getTotalProgress(): { completed: number; total: number } {
  let total = 0;
  let completed = 0;
  for (const mod of TAROT_MODULES) {
    const p = getModuleProgress(mod.id);
    total += p.total;
    completed += p.completed;
  }
  return { completed, total };
}
