"""
Tarot AI interpretation — daily card + DeepSeek SSE streaming.
"""
import json
import ctypes
from datetime import date

import httpx
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import User, DailyQuota
from routers.auth import get_current_user_optional

router = APIRouter(prefix="/api", tags=["interpret"])

# ── Question Classification ──

def classify_question(q: str) -> str:
    """Classify question into: love, career, finance, decision, daily, general."""
    t = (q or "").lower()
    import re
    if re.search(r"感情|恋爱|分手|喜欢|暗恋|表白|婚姻|前任|对象|男友|女友|老公|老婆|暧昧|复合|相亲", t):
        return "love"
    if re.search(r"工作|面试|跳槽|辞职|老板|同事|职场|学业|考试|学习|读书|学校|专业|考研", t):
        return "career"
    if re.search(r"钱|投资|理财|财运|生意|赚钱|亏损|股票|基金|贷款|债务", t):
        return "finance"
    if re.search(r"要不要|该不该|选哪个|怎么办|建议|决定|选择|纠结|犹豫|怎么选", t):
        return "decision"
    if re.search(r"今天|今日|运势|今天怎么样|明天的运势|本周|这周", t):
        return "daily"
    return "general"


# ── Adaptive output guidance by category ──

CATEGORY_GUIDANCE = {
    "love": """## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析感情/人际关系的现状、对方心态、关系走向
- 可附带个人成长方向，但不必展开事业或财运
- 若牌面有明显的事业/财运信号，可在末尾简要提及
- 结尾给一句可执行的建议""",

    "career": """## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析工作/学业方向、机遇与挑战、关键时间节点
- 给出务实的具体行动建议
- 可附带情绪状态的影响，但不必展开感情维度
- 结尾给一句可执行的建议""",

    "finance": """## 输出结构
- 开篇直接给出核心判断（1-2句，结论前置）
- 重点分析财务趋势、风险点、机会窗口
- 结合牌面元素给出理财方向的具体指引
- 结尾给一句可执行的建议""",

    "decision": """## 输出结构
- 开篇**直接给出推荐选择**（1-2句，结论前置）
- 分"有利因素"和"需要注意"两部分分析
- 若有多个选项，逐一简析各自的牌面信号
- 3条具体行动步骤，每条关联具体牌面""",

    "daily": """## 输出结构
- 开篇一句话总览今日能量
- 简短分析今日的关键主题和需要注意的事
- 1-2条行动提示
- 总体200-350字，简洁直接""",

    "general": """## 输出结构
- 开篇给出核心洞察（1-2句，结论前置）
- 根据牌面自然展开2-4个相关维度（不必强行覆盖所有领域）
- 分析牌与牌之间的呼应、矛盾或能量流动
- 2-3条具体建议，每条关联具体牌面
- 结尾一句总结""",
}

# ── System prompts (mirrored from frontend lib/ai-prompts.ts) ──

BASE_SYSTEM_PROMPT = """你是融合东西方智慧的资深塔罗解读师。你说话自然、接地气，像一个真正懂行的朋友在帮人解牌——不故作神秘，不堆砌术语，直接告诉求问者牌面在说什么。

## 核心原则
- 每张牌必须结合其所在牌位的含义进行解读
- 分析牌与牌之间的呼应、冲突和能量流动
- 每个判断必须有牌面象征或牌位逻辑作为依据
- **结论前置**：开篇直接给出最重要的判断，别绕弯子
- 语言自然口语化，像在跟朋友聊天，不是写星座专栏
- 总字数200-800字，根据问题复杂度自调节，不必凑字数"""

FOLLOW_UP_SYSTEM_PROMPT = """你是融合东西方智慧的资深塔罗解读师。现在求问者正在对你的上次解读进行追问。

## 回复要求
- 直接回答追问，不绕弯子
- 基于上次解读的牌面进行延伸，不要凭空发挥
- 如果追问涉及具体行动，给出可执行的建议
- 允许反问或引导求问者澄清问题
- 150-350字"""

PERSONA_PROMPTS = {
    "default": BASE_SYSTEM_PROMPT + "\n## 风格\n- 平衡务实与灵性，像一位阅历丰富的朋友\n- 温暖直接，说人话",

    "mystic": BASE_SYSTEM_PROMPT + """\n## 风格：诗意哲人
- 善于用自然意象和故事隐喻来解释牌面
- 引用神话原型但不掉书袋，点到为止
- 让求问者感受到牌面背后的深层智慧
- 每段解读都像在讲一个短小有力的寓言""",

    "counselor": BASE_SYSTEM_PROMPT + """\n## 风格：心理顾问
- 融合荣格心理学视角，关注潜意识模式和内在动力
- 用共情的方式点出求问者可能没意识到的情绪或信念
- 帮助求问者看到"为什么我会抽到这些牌"
- 语言温和但有穿透力，不兜圈子""",

    "coach": BASE_SYSTEM_PROMPT + """\n## 风格：行动教练
- 直接、干脆、不废话
- 每个观点都带一个可执行的动作建议
- 关注"下一步做什么"，而非空洞安慰
- 允许使用"第一步""关键动作""踩坑提醒"等务实表达""",
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
async def interpret(
    request: Request,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """SSE streaming AI interpretation via DeepSeek.

    Expects JSON body: { cards, isReversed, question, spreadType, positions?, style?, history? }
    Returns text/event-stream with data: {"content": "..."} chunks.

    Authenticated users must have remaining quota. Guests are limited to 1
    free interpretation (enforced client-side via localStorage).
    """
    settings = get_settings()
    api_key = settings.deepseek_api_key

    if not api_key:
        return JSONResponse(
            {"error": "AI 服务尚未配置。请在 .env.local 中设置有效的 DEEPSEEK_API_KEY。您仍可查看标准解读。"},
            status_code=503,
        )

    # Quota gate for authenticated users
    if user and hasattr(user, "id") and not getattr(user, "is_admin", False):
        today_str = date.today().isoformat()
        dq = db.query(DailyQuota).filter(
            DailyQuota.user_id == user.id,
            DailyQuota.date == today_str,
        ).first()
        if dq:
            remaining = dq.base_quota + dq.bonus_quota + (dq.gifted_quota or 0) - dq.used_count
            if remaining <= 0:
                return JSONResponse(
                    {"error": "今日AI解读次数已用完，请签到获取更多或明天再来"},
                    status_code=429,
                )

    body = await request.json()
    cards = body.get("cards", [])
    is_reversed = body.get("isReversed", [])
    question = body.get("question", "")
    spread_type = body.get("spreadType", "")
    positions = body.get("positions") or []
    style = body.get("style", "default")
    history = body.get("history") or []
    birth_chart = body.get("birthChart") or {}

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
        # Classify the question
        category = classify_question(question)
        cat_labels = {"love": "感情", "career": "事业学业", "finance": "财运", "decision": "决策", "daily": "日常运势", "general": "综合"}

        position_context = ""
        if positions:
            position_context = "\n## 各牌位含义\n" + "\n".join(
                f"{j + 1}. **{p}**：此牌位代表求问者此方面的能量状态"
                for j, p in enumerate(positions)
            ) + "\n"

        guidance = CATEGORY_GUIDANCE.get(category, CATEGORY_GUIDANCE["general"])

        # Build birth chart context
        birth_context = ""
        if birth_chart:
            parts = []
            if birth_chart.get("zodiac"):
                parts.append(f"- 太阳星座：{birth_chart['zodiac']}")
            if birth_chart.get("birth_date"):
                parts.append(f"- 出生日期：{birth_chart['birth_date']}")
            if birth_chart.get("birth_time"):
                parts.append(f"- 出生时间：{birth_chart['birth_time']}")
            if birth_chart.get("birth_place"):
                parts.append(f"- 出生地点：{birth_chart['birth_place']}")
            if parts:
                birth_context = "\n## 问询者星盘信息\n" + "\n".join(parts) + "\n\n请在解读时结合以上星盘信息——分析牌面元素与星盘元素的呼应或冲突，以及牌面行星对应与星盘可能的关联。\n"

        user_prompt = f"""## 问询者的问题
{question_text}
（问题类别：{cat_labels.get(category, "综合")}）

## 牌阵类型
{spread_type}
{position_context}
## 抽到的牌
{chr(10).join(card_descriptions)}
{birth_context}
{guidance}

请按以上结构和原则进行解读。"""

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
                        "model": settings.deepseek_model,
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
