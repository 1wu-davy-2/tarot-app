import { type NextRequest } from "next/server";
import crypto from "crypto";
import { buildMessages } from "@/lib/ai-prompts";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8188";

function decryptApiKey(encryptedBase64: string): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY environment variable is not set");

  const key = crypto.createHash("sha256").update(secret).digest();
  const data = Buffer.from(encryptedBase64, "base64");
  const nonce = data.subarray(0, 12);
  const ciphertext = data.subarray(12);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const ct = ciphertext.subarray(0, ciphertext.length - 16);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf-8");
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const configRes = await fetch(`${BACKEND_URL}/api/ai-config`);
    if (!configRes.ok) {
      return new Response(
        JSON.stringify({ error: "AI 服务尚未配置。您仍可查看标准解读。" }),
        { status: 503 }
      );
    }

    const config = await configRes.json();
    let apiKey: string;
    try {
      apiKey = decryptApiKey(config.api_key);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI 服务配置错误，请检查 ENCRYPTION_KEY。您仍可查看标准解读。" }),
        { status: 500 }
      );
    }

    const model = config.model || "deepseek-v4-pro";

    const { cards, isReversed, question, spreadType, positions, style, history, birthChart } = body;
    if (!cards || !isReversed || cards.length === 0) {
      return Response.json({ error: "Missing cards data" }, { status: 400 });
    }

    const isFollowUp = history && history.length > 0;
    const messages = buildMessages({
      cards,
      isReversed,
      question,
      spreadType,
      positions,
      style,
      history,
      birthChart,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600000);

    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: isFollowUp ? 1500 : 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!deepseekRes.ok) {
      const errorText = await deepseekRes.text();
      console.error("DeepSeek API error:", deepseekRes.status, errorText);
      let msg: string;
      switch (deepseekRes.status) {
        case 401:
          msg = "AI 服务认证失败，请检查 DEEPSEEK_API_KEY 是否有效。您仍可查看标准解读。";
          break;
        case 429:
          msg = "AI 服务请求过于频繁，请稍后重试。您可先查看标准解读。";
          break;
        default:
          msg = `AI 服务暂时不可用（${deepseekRes.status}），您可查看标准解读作为参考。`;
      }
      return Response.json({ error: msg }, { status: 502 });
    }

    if (!deepseekRes.body) {
      return Response.json(
        { error: "AI 服务暂时不可用，您可查看标准解读作为参考。" },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(streamController) {
        const reader = deepseekRes.body!.getReader();
        if (!reader) { streamController.close(); return; }

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
              } catch { /* skip */ }
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
      return Response.json(
        { error: "AI 解读请求超时，请稍后重试。您可先查看标准解读。" },
        { status: 504 }
      );
    }
    return Response.json(
      { error: "AI 服务连接失败，请检查网络。您可查看标准解读作为参考。" },
      { status: 500 }
    );
  }
}
