import { type NextRequest } from "next/server";
import type { TarotCard } from "@/lib/tarot-data";

const BASE_SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗解读师。

## 核心原则
- 每张牌必须结合其所在牌位的含义进行解读，而非孤立地解释牌面
- 分析牌与牌之间的呼应、冲突和能量流动
- 综合解读应揭示牌阵整体的能量格局，而非逐牌罗列
- 每个判断必须有牌面象征或牌位逻辑作为依据

## 回复格式
必须严格按照以下五个维度进行解读，每个维度用 Markdown 二级标题（##）分隔：

## 🌟 综合解读
- 结合牌阵整体格局与问询者处境，分析核心能量与关键主题
- 揭示牌面之间的呼应关系与潜在矛盾
- 解读牌位之间的能量流动方向
- 80-120字

## 💕 感情运势
- 结合牌面象征与对应牌位，分析感情/人际关系的现状与趋势
- 不论问询者是否明确问感情，都需分析情感维度
- 60-100字

## 💼 事业学业
- 结合牌面与牌位，分析工作、学业、事业发展方向
- 给出务实的具体指引
- 60-100字

## 💰 财运分析
- 分析财务趋势和金钱相关的能量
- 结合牌面元素给出理财方向的指引
- 50-80字

## 💡 行动建议
- 提供3条具体可行的建议，每条建议应关联特定的牌面或牌位
- 每条建议以编号列出
- 每条20-40字

## ✨ 箴言
- 用一句话总结本次解读的核心智慧
- 简洁有力，富有诗意

## 风格要求
- 融合西方塔罗象征与东方哲学智慧
- 不过于玄学化，每个判断都有牌面依据
- 总字数400-600字`;

const FOLLOW_UP_SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗解读师。现在求问者正在对你的上次解读进行追问。

## 回复要求
- 基于上次解读的牌面和结论进行回答
- 回答要聚焦于求问者的追问，给出实用、具体的指引
- 保持温暖而有力量的口吻
- 如果追问与牌面无关，也可以从塔罗智慧的角度给出一般性建议
- 150-300字`;

const PERSONA_PROMPTS: Record<string, string> = {
  default: BASE_SYSTEM_PROMPT + `\n## 解读风格\n- 平衡神秘与务实，像一位睿智的引路人\n- 温暖而有力量`,

  mystic: BASE_SYSTEM_PROMPT + `\n## 解读风格：神秘巫师
- 你是一位隐居在古老图书馆中的神秘学者，精通东西方玄学
- 语言如诗般优美，充满隐喻和象征
- 引用牌面的神话原型和宇宙能量
- 让求问者感受到命运的宏大与神秘
- 可以适当使用"命运之轮"、"宇宙"、"星辰"等神秘意象`,

  counselor: BASE_SYSTEM_PROMPT + `\n## 解读风格：心理咨询师
- 你是一位温暖而专业的心理顾问，融合荣格心理学与塔罗智慧
- 注重求问者的内心感受和潜意识模式
- 语言温和、共情，使用心理学视角解读牌面
- 帮助求问者理解自己的内在动机和情感需求
- 可以适当使用"内在小孩"、"阴影"、"自性化"等心理学概念`,

  coach: BASE_SYSTEM_PROMPT + `\n## 解读风格：实用教练
- 你是一位务实的人生教练，擅长将塔罗智慧转化为行动计划
- 语言直接、简洁、有力，不喜欢绕弯子
- 每个观点都附带可执行的行动步骤
- 关注实际问题的解决，而非空泛的安慰
- 可以适当使用"第一步"、"关键行动"、"突破口"等行动导向的词汇`,
};

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    cards: TarotCard[];
    isReversed: boolean[];
    question?: string;
    spreadType: string;
    positions?: string[];
    style?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  const { cards, isReversed, question, spreadType, positions, style, history } = body;
  const isFollowUp = history && history.length > 0;

  if (!cards || !isReversed || cards.length === 0) {
    return Response.json({ error: "Missing cards data" }, { status: 400 });
  }

  // Build rich card descriptions with position meanings and symbolism
  const cardDescriptions = cards
    .map((c, i) => {
      const orient = isReversed[i] ? "逆位" : "正位";
      const meaning = isReversed[i] ? c.reversedMeaning : c.uprightMeaning;
      const keywords = c.keywords.join("、");
      const posLabel = positions?.[i] || (spreadType === "每日单牌" ? "" : `牌位${i + 1}`);
      const posStr = posLabel ? ` 【${posLabel}】` : "";
      let desc = `### ${c.nameCN}${posStr}（${orient}）\n`;
      desc += `- 关键词：${keywords}\n`;
      desc += `- 牌意：${meaning}\n`;
      if (c.element) desc += `- 元素：${c.element}\n`;
      if (c.planet) desc += `- 行星：${c.planet}\n`;
      if (c.symbolism) desc += `- 象征：${c.symbolism}\n`;
      return desc;
    })
    .join("\n");

  const questionText = question?.trim() || "求问者心中默想，未明确说出具体问题";

  // Select system prompt based on style
  const persona = (style && PERSONA_PROMPTS[style]) ? PERSONA_PROMPTS[style] : PERSONA_PROMPTS.default;
  const systemPrompt = isFollowUp ? FOLLOW_UP_SYSTEM_PROMPT : persona;

  // Build messages array
  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (isFollowUp) {
    // For follow-up: include the full conversation history
    messages.push(...history!.map((h) => ({ role: h.role, content: h.content })));
  } else {
    // Build position context for initial reading
    let positionContext = "";
    if (positions && positions.length > 0) {
      positionContext = "\n## 各牌位含义（每张牌所处的位置代表此牌在该领域的能量与影响）\n" + positions
        .map((p, i) => `${i + 1}. **${p}**：此牌位代表求问者此方面的能量状态，解读此位置的牌时需要聚焦于该领域`)
        .join("\n") + "\n";
    }

    const userPrompt = `## 问询者的问题
${questionText}

## 牌阵类型
${spreadType}
${positionContext}
## 抽到的牌
${cardDescriptions}

请结合每个牌位的含义，对以上牌面进行完整解读。要求：
1. 每张牌的解读必须与其所处的牌位含义紧密结合
2. 分析牌与牌之间的呼应、矛盾或能量流动
3. 综合解读应揭示牌阵整体的能量格局
4. 按系统提示中要求的五个维度 + 一句箴言输出`;

    messages.push({ role: "user", content: userPrompt });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your-")) {
    return Response.json(
      { error: "AI 服务尚未配置。请在 .env.local 中设置有效的 DEEPSEEK_API_KEY。您仍可查看标准解读。" },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: isFollowUp ? 1500 : 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      const msg = response.status === 401
        ? "AI 服务认证失败，请检查 DEEPSEEK_API_KEY 是否有效。您仍可查看标准解读。"
        : response.status === 429
          ? "AI 服务请求过于频繁，请稍后重试。您可先查看标准解读。"
          : `AI 服务暂时不可用（${response.status}），您可查看标准解读作为参考。`;
      return Response.json({ error: msg }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(streamController) {
        const reader = response.body?.getReader();
        if (!reader) {
          streamController.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                streamController.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
        } finally {
          streamController.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Interpret API error:", error);
    if (error?.name === "AbortError") {
      return Response.json({ error: "AI 解读请求超时，请稍后重试。您可先查看标准解读。" }, { status: 504 });
    }
    return Response.json({ error: "AI 服务连接失败，请检查网络。您可查看标准解读作为参考。" }, { status: 500 });
  }
}
