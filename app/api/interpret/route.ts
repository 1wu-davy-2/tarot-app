import { type NextRequest } from "next/server";
import type { TarotCard } from "@/lib/tarot-data";

const SYSTEM_PROMPT = `你是融合东西方智慧的资深塔罗师。你的解读：
- 结合牌面象征与问询者处境
- 融合西方神秘学与东方哲学智慧
- 温暖、深刻、给人启发
- 不过于玄学化，侧重实用指引
- 使用结构化 Markdown 格式回复
- 总字数控制在 300-500 字
- 语气神秘而温暖，像一位睿智的引路人`;

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

  const cardDescriptions = cards
    .map((c, i) => `${c.nameCN}（${isReversed[i] ? "逆位" : "正位"}）：${isReversed[i] ? c.reversedMeaning : c.uprightMeaning}`)
    .join("\n");

  const questionText = question?.trim() || "未说明具体问题，求问者心中默想";

  const userPrompt = `问题：${questionText}
牌阵：${spreadType}
抽到的牌：
${cardDescriptions}

请从以下角度解读：
1. 🌟 整体能量
2. 🔮 各牌详解
3. 💡 行动建议
4. ✨ 一句箴言`;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your-")) {
    return Response.json(
      { error: "AI 服务尚未配置。请在 .env.local 中设置有效的 DEEPSEEK_API_KEY。您仍可查看标准解读。" },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.8,
        max_tokens: 2000,
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
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
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
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
        } finally {
          controller.close();
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
