export const dynamic = "force-static";

// AI interpretation — proxy to DeepSeek (web mode)
// In APK static export mode: these routes are not used (APK calls backend directly)
import { type NextRequest } from "next/server";
import crypto from "crypto";
import { buildMessages } from "@/lib/ai-prompts";

const BACKEND_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8188";

async function decryptApiKey(encrypted: string, keyHex: string): Promise<string> {
  const key = Buffer.from(keyHex, "hex");
  const parts = encrypted.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const ciphertext = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  (decipher as any).setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cards, isReversed, question, spreadType, positions, style, history, birthChart } = body;

  // Fetch encrypted API key from backend
  const configRes = await fetch(`${BACKEND_BASE}/api/ai-config`);
  if (!configRes.ok) {
    return new Response(JSON.stringify({ error: "AI 服务尚未配置" }), { status: 503 });
  }
  const config = await configRes.json();

  const keyHex = process.env.ENCRYPTION_KEY || "";
  const apiKey = await decryptApiKey(config.api_key, keyHex);
  const model = config.model || "deepseek-v4-pro";

  const messages = buildMessages({
    cards: cards || [],
    isReversed: isReversed || [],
    question,
    spreadType: spreadType || "自定义牌阵",
    positions: positions || [],
    style: style || "default",
    history,
    birthChart,
  });

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
      max_tokens: (history && history.length > 0) ? 1500 : 3000,
    }),
  });

  if (!deepseekRes.ok) {
    const status = deepseekRes.status;
    return new Response(
      JSON.stringify({
        error: status === 401 ? "AI 服务认证失败" : status === 429 ? "请求过于频繁" : "AI 服务暂时不可用",
      }),
      { status }
    );
  }

  // Stream SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = deepseekRes.body?.getReader();
      if (!reader) { controller.close(); return; }
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch { /* stream error */ }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
