"""
Tarot AI interpretation — daily card + DeepSeek SSE streaming.
"""
import json
import ctypes
from datetime import date

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

from config import get_settings

router = APIRouter(prefix="/api", tags=["interpret"])

# ── System prompts (mirrored from frontend app/api/interpret/route.ts) ──

BASE_SYSTEM_PROMPT = """你是融合东西方智慧的资深塔罗解读师。

## 核心原则
- 每张牌必须结合其所在牌位的含义进行解读，而非孤立地解释牌面
- 分析牌与牌之间的呼应、冲突和能量流动
- 综合解读应揭示牌阵整体的能量格局，而非逐牌罗列
- 每个判断必须有牌面象征或牌位逻辑作为依据

## 回复格式
必须严格按照以下五个维度进行解读，每个维度用 Markdown 二级标题（##）分隔：

## 综合解读
- 结合牌阵整体格局与问询者处境，分析核心能量与关键主题
- 揭示牌面之间的呼应关系与潜在矛盾
- 解读牌位之间的能量流动方向
- 80-120字

## 感情运势
- 结合牌面象征与对应牌位，分析感情/人际关系的现状与趋势
- 不论问询者是否明确问感情，都需分析情感维度
- 60-100字

## 事业学业
- 结合牌面与牌位，分析工作、学业、事业发展方向
- 给出务实的具体指引
- 60-100字

## 财运分析
- 分析财务趋势和金钱相关的能量
- 结合牌面元素给出理财方向的指引
- 50-80字

## 行动建议
- 提供3条具体可行的建议，每条建议应关联特定的牌面或牌位
- 每条建议以编号列出
- 每条20-40字

## 箴言
- 用一句话总结本次解读的核心智慧
- 简洁有力，富有诗意

## 风格要求
- 融合西方塔罗象征与东方哲学智慧
- 不过于玄学化，每个判断都有牌面依据
- 总字数400-600字"""

FOLLOW_UP_SYSTEM_PROMPT = """你是融合东西方智慧的资深塔罗解读师。现在求问者正在对你的上次解读进行追问。

## 回复要求
- 基于上次解读的牌面和结论进行回答
- 回答要聚焦于求问者的追问，给出实用、具体的指引
- 保持温暖而有力量的口吻
- 如果追问与牌面无关，也可以从塔罗智慧的角度给出一般性建议
- 150-300字"""

PERSONA_PROMPTS = {
    "default": BASE_SYSTEM_PROMPT + "\n## 解读风格\n- 平衡神秘与务实，像一位睿智的引路人\n- 温暖而有力量",

    "mystic": BASE_SYSTEM_PROMPT + """\n## 解读风格：神秘巫师
- 你是一位隐居在古老图书馆中的神秘学者，精通东西方玄学
- 语言如诗般优美，充满隐喻和象征
- 引用牌面的神话原型和宇宙能量
- 让求问者感受到命运的宏大与神秘
- 可以适当使用"命运之轮"、"宇宙"、"星辰"等神秘意象""",

    "counselor": BASE_SYSTEM_PROMPT + """\n## 解读风格：心理咨询师
- 你是一位温暖而专业的心理顾问，融合荣格心理学与塔罗智慧
- 注重求问者的内心感受和潜意识模式
- 语言温和、共情，使用心理学视角解读牌面
- 帮助求问者理解自己的内在动机和情感需求
- 可以适当使用"内在小孩"、"阴影"、"自性化"等心理学概念""",

    "coach": BASE_SYSTEM_PROMPT + """\n## 解读风格：实用教练
- 你是一位务实的人生教练，擅长将塔罗智慧转化为行动计划
- 语言直接、简洁、有力，不喜欢绕弯子
- 每个观点都附带可执行的行动步骤
- 关注实际问题的解决，而非空泛的安慰
- 可以适当使用"第一步"、"关键行动"、"突破口"等行动导向的词汇""",
}


# ── Daily card helpers ──

def to_int32(val: int) -> int:
    """JS-style 32-bit signed integer conversion (x | 0)."""
    val = val & 0xFFFFFFFF
    if val >= 0x80000000:
        val -= 0x100000000
    return val


def hash_string(s: str) -> int:
    """Replicate JS hashString() from lib/daily-seed.ts."""
    h = 0
    for ch in s:
        h = to_int32((h << 5) - h + ord(ch))
    return abs(h)


# ── Endpoints ──

@router.get("/daily-reading")
def daily_reading():
    """Return deterministic daily card index + isReversed.

    Frontend already has full card data (tarot-data.ts); it just needs
    which card and orientation to display.
    """
    today = date.today()
    date_str = today.isoformat()
    seed = hash_string(date_str)

    # 78 cards in Rider-Waite deck
    card_index = seed % 78
    is_reversed = (seed % 2) == 1

    return {
        "date": date_str,
        "card_index": card_index,
        "isReversed": is_reversed,
    }


@router.post("/interpret")
async def interpret(request: Request):
    """SSE streaming AI interpretation via DeepSeek.

    Expects JSON body: { cards, isReversed, question, spreadType, positions?, style?, history? }
    Returns text/event-stream with data: {"content": "..."} chunks.
    """
    settings = get_settings()
    api_key = settings.deepseek_api_key

    if not api_key:
        return JSONResponse(
            {"error": "AI 服务尚未配置。请在 .env.local 中设置有效的 DEEPSEEK_API_KEY。您仍可查看标准解读。"},
            status_code=503,
        )

    body = await request.json()
    cards = body.get("cards", [])
    is_reversed = body.get("isReversed", [])
    question = body.get("question", "")
    spread_type = body.get("spreadType", "")
    positions = body.get("positions") or []
    style = body.get("style", "default")
    history = body.get("history") or []

    if not cards:
        return JSONResponse({"error": "Missing cards data"}, status_code=400)

    is_follow_up = len(history) > 0

    # Build card descriptions
    card_descriptions = []
    for i, c in enumerate(cards):
        orient = "逆位" if (is_reversed[i] if i < len(is_reversed) else False) else "正位"
        meaning = c.get("reversedMeaning") if (is_reversed[i] if i < len(is_reversed) else False) else c.get("uprightMeaning", "")
        keywords = "、".join(c.get("keywords", []))
        pos_label = (positions[i] if i < len(positions) else "") or ("" if spread_type == "每日单牌" else f"牌位{i + 1}")
        pos_str = f" 【{pos_label}】" if pos_label else ""
        desc = f"### {c.get('nameCN', 'Unknown')}{pos_str}（{orient}）\n"
        desc += f"- 关键词：{keywords}\n"
        desc += f"- 牌意：{meaning}\n"
        if c.get("element"):
            desc += f"- 元素：{c['element']}\n"
        if c.get("planet"):
            desc += f"- 行星：{c['planet']}\n"
        if c.get("symbolism"):
            desc += f"- 象征：{c['symbolism']}\n"
        card_descriptions.append(desc)

    question_text = question.strip() or "求问者心中默想，未明确说出具体问题"

    persona = PERSONA_PROMPTS.get(style, PERSONA_PROMPTS["default"])
    system_prompt = FOLLOW_UP_SYSTEM_PROMPT if is_follow_up else persona

    messages = [{"role": "system", "content": system_prompt}]

    if is_follow_up:
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
    else:
        position_context = ""
        if positions:
            position_context = "\n## 各牌位含义（每张牌所处的位置代表此牌在该领域的能量与影响）\n" + "\n".join(
                f"{j + 1}. **{p}**：此牌位代表求问者此方面的能量状态，解读此位置的牌时需要聚焦于该领域"
                for j, p in enumerate(positions)
            ) + "\n"

        user_prompt = f"""## 问询者的问题
{question_text}

## 牌阵类型
{spread_type}
{position_context}
## 抽到的牌
{chr(10).join(card_descriptions)}

请结合每个牌位的含义，对以上牌面进行完整解读。要求：
1. 每张牌的解读必须与其所处的牌位含义紧密结合
2. 分析牌与牌之间的呼应、矛盾或能量流动
3. 综合解读应揭示牌阵整体的能量格局
4. 按系统提示中要求的五个维度 + 一句箴言输出"""

        messages.append({"role": "user", "content": user_prompt})

    async def event_stream():
        async with httpx.AsyncClient(timeout=600.0) as client:
            try:
                async with client.stream(
                    "POST",
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                    json={
                        "model": "deepseek-v4-pro",
                        "messages": messages,
                        "stream": True,
                        "temperature": 0.7,
                        "max_tokens": 1500 if is_follow_up else 3000,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        if response.status_code == 401:
                            msg = "AI 服务认证失败，请检查 DEEPSEEK_API_KEY 是否有效。您仍可查看标准解读。"
                        elif response.status_code == 429:
                            msg = "AI 服务请求过于频繁，请稍后重试。您可先查看标准解读。"
                        else:
                            msg = f"AI 服务暂时不可用（{response.status_code}），您可查看标准解读作为参考。"
                        yield f"data: {json.dumps({'error': msg})}\n\n"
                        return

                    buffer = ""
                    async for chunk in response.aiter_bytes():
                        if not chunk:
                            continue
                        buffer += chunk.decode("utf-8", errors="replace")
                        lines = buffer.split("\n")
                        buffer = lines.pop() or ""

                        for line in lines:
                            trimmed = line.strip()
                            if not trimmed or not trimmed.startswith("data: "):
                                continue
                            data = trimmed[6:]
                            if data == "[DONE]":
                                yield "data: [DONE]\n\n"
                                continue
                            try:
                                parsed = json.loads(data)
                                content = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if content:
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                            except json.JSONDecodeError:
                                pass

            except httpx.ReadTimeout:
                yield f"data: {json.dumps({'error': 'AI 解读请求超时，请稍后重试。您可先查看标准解读。'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'AI 服务连接失败：{str(e)}。您可查看标准解读作为参考。'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
