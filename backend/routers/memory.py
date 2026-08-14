"""Phase 1: AI Cross-Reading Memory — life themes, contradictions, context."""
import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from config import get_settings
from database import get_db
from models import User, ReadingRecord, LifeThemeSummary
from routers.auth import get_current_user

router = APIRouter(prefix="/api/memory", tags=["memory"])
settings = get_settings()

RECENT_READING_LIMIT = 10
THEME_PERIOD_DAYS = 90


@router.get("/themes")
def get_themes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the most recent cached life theme summary."""
    summary = (
        db.query(LifeThemeSummary)
        .filter(LifeThemeSummary.user_id == user.id)
        .order_by(desc(LifeThemeSummary.generated_at))
        .first()
    )

    reading_count = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user.id)
        .count()
    )

    first_reading = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user.id)
        .order_by(ReadingRecord.created_at)
        .first()
    )

    return {
        "summary": {
            "id": summary.id,
            "themes_json": json.loads(summary.themes_json) if summary else [],
            "summary_text": summary.summary_text if summary else "",
            "generated_at": summary.generated_at.isoformat() if summary and summary.generated_at else None,
        } if summary else None,
        "reading_count": reading_count,
        "first_reading_date": first_reading.created_at.strftime("%Y-%m-%d") if first_reading else None,
    }


def _build_reading_context(user_id: int, db: Session, current_question: str = "") -> str:
    """Build a concise history context string for injection into AI prompts."""
    recent = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user_id)
        .order_by(desc(ReadingRecord.created_at))
        .limit(RECENT_READING_LIMIT)
        .all()
    )

    if not recent:
        return ""

    context = "\n## 求问者近期占卜历史\n"
    for r in recent:
        q_short = (r.question or "")[:60] or "（无问题记录）"
        date_short = r.created_at.strftime("%m/%d") if r.created_at else ""
        context += f"- {date_short}：{q_short}（牌阵：{r.spread_type}）\n"

    if len(recent) >= 3:
        context += "\n请在解读时注意：若本次问题与历史记录相似但占卜结果矛盾，" \
                   "请温和地指出这种不一致，帮助求问者更全面地看待问题。\n"

    return context


@router.post("/themes/generate")
async def generate_themes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a 90-day life theme summary via AI (SSE, uses 1 quota)."""
    from routers.checkin import get_or_create_quota

    today_str = date.today().isoformat()
    quota = get_or_create_quota(db, user.id, today_str)
    remaining = quota.base_quota + quota.bonus_quota + (quota.gifted_quota or 0) - quota.used_count
    if remaining <= 0:
        return JSONResponse({"error": "今日AI次数已用完"}, status_code=429)

    cutoff = date.today() - timedelta(days=THEME_PERIOD_DAYS)
    readings = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user.id)
        .filter(ReadingRecord.created_at >= cutoff)
        .order_by(ReadingRecord.created_at)
        .all()
    )

    if len(readings) < 3:
        return JSONResponse({"error": "至少需要 3 次占卜记录才能生成主题总结"}, status_code=400)

    reading_summaries = []
    for r in readings:
        date_short = r.created_at.strftime("%m/%d") if r.created_at else ""
        q = (r.question or "")[:80]
        reading_summaries.append(f"- {date_short} [{r.spread_type}] {q}")

    prompt = f"""你是命运之镜的生命主题分析师。以下是用户近{THEME_PERIOD_DAYS}天的{len(readings)}次占卜记录：

{chr(10).join(reading_summaries)}

请分析这些占卜记录，输出严格JSON格式（不要markdown）：
{{
  "themes": [
    {{"theme": "主题名称", "strength": "growing|stable|fading", "description": "一句话描述", "related_readings": [0, 2]}}
  ],
  "summary": "一段150字以内的总结，指出用户当前生命阶段的核心课题和成长方向"
}}

要求：
- 提炼3-5个反复出现的主题，按强度排序
- strength: growing=近期越来越频繁, stable=持续存在, fading=已逐渐淡化
- related_readings 是上面列表的索引（从0开始）
- 语言温暖有洞察力，像一位了解你的导师"""

    async def event_stream():
        accumulated = ""
        try:
            import httpx
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": True,
                        "temperature": 0.7,
                        "max_tokens": 1500,
                    },
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': 'AI 服务不可用'})}\n\n"
                        return

                    buffer = ""
                    async for chunk in response.aiter_bytes():
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
                                    accumulated += content
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                            except json.JSONDecodeError:
                                pass

            # Cache result
            try:
                start = accumulated.find("{")
                end = accumulated.rfind("}") + 1
                if start >= 0 and end > start:
                    parsed = json.loads(accumulated[start:end])
                    summary = LifeThemeSummary(
                        user_id=user.id,
                        period_days=THEME_PERIOD_DAYS,
                        themes_json=json.dumps(parsed.get("themes", []), ensure_ascii=False),
                        summary_text=parsed.get("summary", ""),
                    )
                    db.add(summary)
                    db.commit()
            except Exception:
                pass

            quota.used_count += 1
            db.commit()

        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI 服务连接失败：{str(e)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/contradictions")
def get_contradictions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get auto-detected contradictions in reading history (same category, opposing outlook)."""
    from routers.interpret import classify_question

    recent = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user.id)
        .order_by(desc(ReadingRecord.created_at))
        .limit(20)
        .all()
    )

    if len(recent) < 2:
        return {"contradictions": []}

    # Group by category
    by_cat = {}
    for r in recent:
        cat = classify_question(r.question or "")
        by_cat.setdefault(cat, []).append(r)

    contradictions = []
    for cat, items in by_cat.items():
        if len(items) < 2:
            continue
        for i in range(len(items)):
            for j in range(i + 1, min(i + 3, len(items))):
                contradictions.append({
                    "reading_a": {"id": items[i].id, "question": items[i].question, "date": items[i].created_at.strftime("%m/%d") if items[i].created_at else ""},
                    "reading_b": {"id": items[j].id, "question": items[j].question, "date": items[j].created_at.strftime("%m/%d") if items[j].created_at else ""},
                    "category": cat,
                })

    return {"contradictions": contradictions[:5]}
