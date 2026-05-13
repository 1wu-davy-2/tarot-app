// System prompts for AI tarot interpretation.
// Mirrored from backend/routers/interpret.py — keep both in sync.

// ── Question Classification ──

export type QuestionCategory = "love" | "career" | "finance" | "decision" | "daily" | "general";

export function classifyQuestion(q: string): QuestionCategory {
  const t = (q || "").toLowerCase();

  if (/感情|恋爱|分手|喜欢|暗恋|表白|婚姻|前任|对象|男友|女友|老公|老婆|暧昧|复合|相亲/.test(t)) return "love";
  if (/工作|面试|跳槽|辞职|老板|同事|职场|学业|考试|学习|读书|学校|专业|考研/.test(t)) return "career";
  if (/钱|投资|理财|财运|生意|赚钱|亏损|股票|基金|贷款|债务/.test(t)) return "finance";
  if (/要不要|该不该|选哪个|怎么办|建议|决定|选择|纠结|犹豫|怎么选/.test(t)) return "decision";
  if (/今天|今日|运势|今天怎么样|明天的运势|本周|这周/.test(t)) return "daily";

  return "general";
}

// ── Adaptive output guidance by category ──

const CATEGORY_GUIDANCE: Record<QuestionCategory, string> = {
  love: `## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析感情/人际关系的现状、对方心态、关系走向
- 可附带个人成长方向，但不必展开事业或财运
- 若牌面有明显的事业/财运信号，可在末尾简要提及
- 结尾给一句可执行的建议`,

  career: `## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析工作/学业方向、机遇与挑战、关键时间节点
- 给出务实的具体行动建议
- 可附带情绪状态的影响，但不必展开感情维度
- 结尾给一句可执行的建议`,

  finance: `## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析财务趋势、风险点、机会窗口
- 结合牌面元素给出理财方向的具体指引
- 结尾给一句可执行的建议`,

  decision: `## 输出结构
- 开篇**直接给出推荐选择**（1-2句，结论前置）
- 分"有利因素"和"需要注意"两部分分析
- 若有多个选项，逐一简析各自的牌面信号
- 3条具体行动步骤，每条关联具体牌面`,

  daily: `## 输出结构
- 开篇一句话总览今日能量
- 简短分析今日的关键主题和需要注意的事
- 1-2条行动提示
- 总体200-350字，简洁直接`,

  general: `## 输出结构
- 开篇给出核心洞察（1-2句，结论前置）
- 根据牌面自然展开2-4个相关维度（不必强行覆盖所有领域）
- 分析牌与牌之间的呼应、矛盾或能量流动
- 2-3条具体建议，每条关联具体牌面
- 结尾一句总结`,
};

// ── Base System Prompt ──

const BASE_SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗解读师。你说话自然、接地气，像一个真正懂行的朋友在帮人解牌——不故作神秘，不堆砌术语，直接告诉求问者牌面在说什么。

## 核心原则
- 每张牌必须结合其所在牌位的含义进行解读
- 分析牌与牌之间的呼应、冲突和能量流动
- 每个判断必须有牌面象征或牌位逻辑作为依据
- **结论前置**：开篇直接给出最重要的判断，别绕弯子
- 语言自然口语化，像在跟朋友聊天，不是写星座专栏
- 总字数200-800字，根据问题复杂度自调节，不必凑字数`;

// ── Follow-up Prompt ──

const FOLLOW_UP_SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗解读师。现在求问者正在对你的上次解读进行追问。

## 回复要求
- 直接回答追问，不绕弯子
- 基于上次解读的牌面进行延伸，不要凭空发挥
- 如果追问涉及具体行动，给出可执行的建议
- 允许反问或引导求问者澄清问题
- 150-350字`;

// ── Persona Prompts ──

const PERSONA_PROMPTS: Record<string, string> = {
  default: BASE_SYSTEM_PROMPT + "\n## 风格\n- 平衡务实与灵性，像一位阅历丰富的朋友\n- 温暖直接，说人话",

  mystic: BASE_SYSTEM_PROMPT + `\n## 风格：诗意哲人
- 善于用自然意象和故事隐喻来解释牌面
- 引用神话原型但不掉书袋，点到为止
- 让求问者感受到牌面背后的深层智慧
- 每段解读都像在讲一个短小有力的寓言`,

  counselor: BASE_SYSTEM_PROMPT + `\n## 风格：心理顾问
- 融合荣格心理学视角，关注潜意识模式和内在动力
- 用共情的方式点出求问者可能没意识到的情绪或信念
- 帮助求问者看到"为什么我会抽到这些牌"
- 语言温和但有穿透力，不兜圈子`,

  coach: BASE_SYSTEM_PROMPT + `\n## 风格：行动教练
- 直接、干脆、不废话
- 每个观点都带一个可执行的动作建议
- 关注"下一步做什么"，而非空洞安慰
- 允许使用"第一步""关键动作""踩坑提醒"等务实表达`,
};

// ── TypeScript Interfaces ──

interface CardData {
  nameCN?: string;
  keywords?: string[];
  uprightMeaning?: string;
  reversedMeaning?: string;
  element?: string;
  planet?: string;
  symbolism?: string;
}

interface BirthChartData {
  zodiac?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
}

interface BuildMessagesInput {
  cards: CardData[];
  isReversed: boolean[];
  question?: string;
  spreadType: string;
  positions?: string[];
  style?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  birthChart?: BirthChartData;
}

// ── Build Messages ──

export function buildMessages(input: BuildMessagesInput): { role: string; content: string }[] {
  const { cards, isReversed, question, spreadType, positions, style, history, birthChart } = input;
  const isFollowUp = history && history.length > 0;

  const persona = (style && PERSONA_PROMPTS[style]) ? PERSONA_PROMPTS[style] : PERSONA_PROMPTS.default;
  const systemPrompt = isFollowUp ? FOLLOW_UP_SYSTEM_PROMPT : persona;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (isFollowUp) {
    for (const h of history!) {
      messages.push({ role: h.role, content: h.content });
    }
  } else {
    // Classify the question
    const category = classifyQuestion(question || "");

    // Build card descriptions
    const cardDescriptions = cards
      .map((c, i) => {
        const orient = isReversed[i] ? "逆位" : "正位";
        const meaning = isReversed[i] ? c.reversedMeaning : c.uprightMeaning;
        const keywords = (c.keywords || []).join("、");
        const posLabel =
          (positions?.[i]) ||
          (spreadType === "每日单牌" ? "" : `牌位${i + 1}`);
        const posStr = posLabel ? ` 【${posLabel}】` : "";
        let desc = `### ${c.nameCN || "Unknown"}${posStr}（${orient}）\n`;
        desc += `- 关键词：${keywords}\n`;
        desc += `- 牌意：${meaning}\n`;
        if (c.element) desc += `- 元素：${c.element}\n`;
        if (c.planet) desc += `- 行星：${c.planet}\n`;
        if (c.symbolism) desc += `- 象征：${c.symbolism}\n`;
        return desc;
      })
      .join("\n");

    const questionText = question?.trim() || "求问者心中默想，未明确说出具体问题";

    // Build position context
    let positionContext = "";
    if (positions && positions.length > 0) {
      positionContext =
        "\n## 各牌位含义\n" +
        positions
          .map((p, j) => `${j + 1}. **${p}**：此牌位代表求问者此方面的能量状态`)
          .join("\n") +
        "\n";
    }

    // Build birth chart context
    let birthContext = "";
    if (birthChart) {
      const parts: string[] = [];
      if (birthChart.zodiac) parts.push(`- 太阳星座：${birthChart.zodiac}`);
      if (birthChart.birth_date) parts.push(`- 出生日期：${birthChart.birth_date}`);
      if (birthChart.birth_time) parts.push(`- 出生时间：${birthChart.birth_time}`);
      if (birthChart.birth_place) parts.push(`- 出生地点：${birthChart.birth_place}`);
      if (parts.length > 0) {
        birthContext = `\n## 问询者星盘信息\n${parts.join("\n")}\n
请在解读时结合以上星盘信息——分析牌面元素与星盘元素的呼应或冲突，以及牌面行星对应与星盘可能的关联。\n`;
      }
    }

    const guidance = CATEGORY_GUIDANCE[category];

    const userPrompt = `## 问询者的问题
${questionText}
（问题类别：${category === "love" ? "感情" : category === "career" ? "事业学业" : category === "finance" ? "财运" : category === "decision" ? "决策" : category === "daily" ? "日常运势" : "综合"}）

## 牌阵类型
${spreadType}
${positionContext}
## 抽到的牌
${cardDescriptions}
${birthContext}
${guidance}

请按以上结构和原则进行解读。`;

    messages.push({ role: "user", content: userPrompt });
  }

  return messages;
}
