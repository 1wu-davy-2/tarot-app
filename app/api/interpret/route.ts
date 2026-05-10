import { type NextRequest } from "next/server";
import type { TarotCard } from "@/lib/tarot-data";

const SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗解读师。你的解读风格神秘而温暖，深刻而实用。

## 回复要求

你必须严格按照以下五个维度进行解读，每个维度用 Markdown 二级标题（##）分隔：

## 🌟 综合解读
- 结合牌阵整体能量与问询者处境，给出全面的能量分析
- 点出牌面之间关键的呼应或矛盾
- 80-120字

## 💕 感情运势
- 结合牌面象征分析感情/人际关系的现状与趋势
- 不论问询者是否明确问感情，都需分析情感维度
- 60-100字

## 💼 事业学业
- 分析工作、学业、事业发展方向
- 结合牌面给出务实建议
- 60-100字

## 💰 财运分析
- 分析财务趋势和金钱相关的能量
- 给出理财方向的指引
- 50-80字

## 💡 行动建议
- 提供3条具体可行的建议
- 每条建议以编号列出
- 每条20-40字

## ✨ 箴言
- 用一句话总结本次解读的核心智慧
- 简洁有力，富有诗意

## 风格要求
- 融合西方塔罗象征与东方哲学智慧
- 温暖而有力量，像一位睿智的引路人
- 不过于玄学化，每个判断都有牌面依据
- 总字数400-600字`;

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    cards: TarotCard[];
    isReversed: boolean[];
    question?: string;
    spreadType: string;
  };

  const { cards, isReversed, question, spreadType } = body;

  if (!cards || !isReversed || cards.length === 0) {
    return Response.json({ error: "Missing cards data" }, { status: 400 });
  }

  // Build rich card descriptions with keywords and symbolism
  const cardDescriptions = cards
    .map((c, i) => {
      const orient = isReversed[i] ? "逆位" : "正位";
      const meaning = isReversed[i] ? c.reversedMeaning : c.uprightMeaning;
      const keywords = c.keywords.join("、");
      const pos = spreadType === "每日单牌" ? "" : ` 【牌位${i + 1}】`;
      let desc = `### ${c.nameCN}${pos}（${orient}）\n`;
      desc += `- 关键词：${keywords}\n`;
      desc += `- 牌意：${meaning}\n`;
      if (c.element) desc += `- 元素：${c.element}\n`;
      if (c.planet) desc += `- 行星：${c.planet}\n`;
      if (c.symbolism) desc += `- 象征：${c.symbolism}\n`;
      return desc;
    })
    .join("\n");

  const questionText = question?.trim() || "求问者心中默想，未明确说出具体问题";

  const userPrompt = `## 问询者的问题
${questionText}

## 牌阵类型
${spreadType}

## 抽到的牌
${cardDescriptions}

请按系统提示中要求的五个维度（综合解读、感情运势、事业学业、财运分析、行动建议）+ 一句箴言，对以上牌面进行完整解读。`;

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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
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
