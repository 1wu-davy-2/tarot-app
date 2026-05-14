"""Daily fortune / zodiac horoscope with AI interpretation."""
import json
import httpx
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routers.auth import get_current_user_optional
from config import get_settings

router = APIRouter(prefix="/api/fortune", tags=["fortune"])
settings = get_settings()

ZODIAC_NAMES = [
    "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
    "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
]
ZODIAC_EMOJI = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]


def _build_fortune_prompt(zodiac: str, gender_hint: str = "") -> str:
    today = __import__("datetime").date.today().strftime("%Y年%m月%d日")
    gender_line = f"用户性别参考：{gender_hint}" if gender_hint else ""
    return f"""你是命运之镜的运势占卜师，请为一位{zodiac}用户生成今日运势解读。{gender_line}

请严格用以下JSON格式回复（不要markdown代码块，直接输出JSON）：
{{
  "summary": "一句话今日运势总结（15字以内，温暖治愈风）",
  "interpretation": "今日运势详细解读（80-120字），结合星座特点给出个性化建议，语气温柔治愈",
  "advice": "今日行动建议（40字以内），具体可行的小建议",
  "warning": "今日避坑提醒（30字以内），提醒注意的地方",
  "mood": "今日心情关键词（2-3个词）"
}}

今日日期：{today}"""


@router.post("/daily")
async def daily_fortune(
    zodiac: str = Query(""),
    gender: str = Query(""),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Generate AI-powered daily fortune for a zodiac sign (SSE stream)."""
    if zodiac not in ZODIAC_NAMES:
        raise HTTPException(status_code=400, detail="无效的星座名称")

    # Determine gender from user profile or query param
    gender_hint = gender or ""

    async def event_stream():
        prompt = _build_fortune_prompt(zodiac, gender_hint)

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.8,
                        "stream": True,
                    },
                )
                response.raise_for_status()

                buffer = ""
                async for chunk in response.aiter_bytes():
                    buffer += chunk.decode("utf-8")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue
                        data = line[6:]
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
            yield f"data: {json.dumps({'error': '运势生成超时，请稍后重试'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI服务连接失败：{str(e)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/zodiac-list")
def zodiac_list():
    """Return list of zodiac signs with emojis."""
    return [{"name": n, "emoji": e, "index": i} for i, (n, e) in enumerate(zip(ZODIAC_NAMES, ZODIAC_EMOJI))]
