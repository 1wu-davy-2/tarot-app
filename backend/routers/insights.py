"""Phase 2: Journal data insights — card-mood correlation, time patterns, annual report."""
import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from config import get_settings
from database import get_db
from models import User, DailyJournal, JournalInsightCache, ReportRecord
from routers.auth import get_current_user

router = APIRouter(prefix="/api/insights", tags=["insights"])
settings = get_settings()


@router.get("/card-mood")
def card_mood_correlation(
    months: int = Query(3, ge=1, le=12),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Card-mood correlation: which cards appear on high/low mood days. Pure SQL, no AI cost."""
    cutoff = (date.today() - timedelta(days=months * 30)).isoformat()

    rows = (
        db.query(
            DailyJournal.card_id,
            DailyJournal.is_reversed,
            func.count(DailyJournal.id).label("cnt"),
            func.avg(DailyJournal.mood).label("avg_mood"),
        )
        .filter(DailyJournal.user_id == user.id)
        .filter(DailyJournal.date >= cutoff)
        .filter(DailyJournal.mood.isnot(None))
        .group_by(DailyJournal.card_id, DailyJournal.is_reversed)
        .having(func.count(DailyJournal.id) >= 2)
        .order_by(func.avg(DailyJournal.mood).desc())
        .all()
    )

    # Mood distribution per card
    cards = []
    for card_id, is_rev, cnt, avg in rows:
        dist = (
            db.query(DailyJournal.mood, func.count(DailyJournal.id))
            .filter(DailyJournal.user_id == user.id)
            .filter(DailyJournal.date >= cutoff)
            .filter(DailyJournal.card_id == card_id)
            .filter(DailyJournal.mood.isnot(None))
            .group_by(DailyJournal.mood)
            .all()
        )
        mood_dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for mood_val, count in dist:
            mood_dist[str(mood_val)] = count

        cards.append({
            "card_id": card_id,
            "is_reversed": is_rev,
            "count": cnt,
            "avg_mood": round(float(avg), 2),
            "mood_distribution": mood_dist,
        })

    total_days = (
        db.query(func.count(DailyJournal.id))
        .filter(DailyJournal.user_id == user.id)
        .filter(DailyJournal.date >= cutoff)
        .scalar()
    )

    return {
        "cards": cards,
        "total_days": total_days or 0,
        "period": {"start": cutoff, "end": date.today().isoformat()},
    }


@router.get("/time-patterns")
def time_patterns(
    months: int = Query(3, ge=1, le=12),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Time patterns: mood by weekday. Pure SQL, no AI cost."""
    cutoff = (date.today() - timedelta(days=months * 30)).isoformat()

    rows = (
        db.query(
            DailyJournal.date,
            DailyJournal.mood,
        )
        .filter(DailyJournal.user_id == user.id)
        .filter(DailyJournal.date >= cutoff)
        .filter(DailyJournal.mood.isnot(None))
        .all()
    )

    weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    by_weekday = {i: {"total": 0, "count": 0} for i in range(7)}

    for date_str, mood_val in rows:
        try:
            d = date.fromisoformat(date_str)
            wd = d.weekday()
            by_weekday[wd]["total"] += mood_val
            by_weekday[wd]["count"] += 1
        except (ValueError, TypeError):
            pass

    weekdays = []
    for i in range(7):
        b = by_weekday[i]
        weekdays.append({
            "day": i,
            "day_name": weekday_names[i],
            "avg_mood": round(b["total"] / b["count"], 2) if b["count"] > 0 else 0,
            "count": b["count"],
        })

    non_zero = [w for w in weekdays if w["count"] > 0]
    lowest = min(non_zero, key=lambda w: w["avg_mood"]) if non_zero else None
    highest = max(non_zero, key=lambda w: w["avg_mood"]) if non_zero else None

    return {
        "by_weekday": weekdays,
        "lowest_day": lowest,
        "highest_day": highest,
        "total_entries": len(rows),
    }


@router.post("/annual-report")
async def annual_report(
    year: int = Query(0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate annual soul report via AI (SSE, uses 1 quota)."""
    from routers.checkin import get_or_create_quota

    report_year = year or date.today().year
    today_str = date.today().isoformat()
    quota = get_or_create_quota(db, user.id, today_str)
    remaining = quota.base_quota + quota.bonus_quota + (quota.gifted_quota or 0) - quota.used_count
    if remaining <= 0:
        return JSONResponse({"error": "今日AI次数已用完"}, status_code=429)

    start_date = f"{report_year}-01-01"
    end_date = f"{report_year}-12-31"

    journals = (
        db.query(DailyJournal)
        .filter(DailyJournal.user_id == user.id)
        .filter(DailyJournal.date >= start_date)
        .filter(DailyJournal.date <= end_date)
        .order_by(DailyJournal.date)
        .all()
    )

    if len(journals) < 10:
        return JSONResponse({"error": f"{report_year}年至少需要10天日记才能生成年度报告"}, status_code=400)

    # Compute stats for the prompt
    total_days = len(journals)
    moods = [j.mood for j in journals if j.mood is not None]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    card_ids = [j.card_id for j in journals]

    from collections import Counter
    card_freq = Counter(card_ids)
    top_card = card_freq.most_common(1)[0][0] if card_freq else 0

    upright = sum(1 for j in journals if not j.is_reversed)
    reversed_count = sum(1 for j in journals if j.is_reversed)

    monthly_moods = {}
    for j in journals:
        if j.mood is not None:
            month_key = j.date[:7]
            monthly_moods.setdefault(month_key, []).append(j.mood)
    monthly_avg = {k: round(sum(v) / len(v), 1) for k, v in sorted(monthly_moods.items())}

    journal_summaries = "\n".join(
        f"- {j.date} | 卡牌#{j.card_id} | {'逆位' if j.is_reversed else '正位'} | 心情:{j.mood or '-'}/5 | {j.note or ''}"
        for j in journals[-50:]
    )

    prompt = f"""你是命运之镜的年度灵魂报告分析师。以下是用户{report_year}年的塔罗日记数据：

## 统计摘要
- 日记总数：{total_days} 天
- 平均情绪：{avg_mood}/5
- 最常出现的牌：卡牌#{top_card}（出现{card_freq[top_card]}次）
- 正位/逆位比：{upright}/{reversed_count}
- 各月平均情绪：{json.dumps(monthly_avg, ensure_ascii=False)}

## 近期日记记录
{journal_summaries}

请以温暖、有洞察力的语气，像 Spotify Wrapped 那样，生成一份年度灵魂报告。严格输出JSON：
{{
  "title": "报告标题（15字以内，如：2026 · 蜕变的年份）",
  "year_card_name": "年度之牌（一张最能代表这一年的塔罗牌名）",
  "year_card_reason": "为什么这张牌代表这一年（50字以内）",
  "core_themes": ["主题1", "主题2", "主题3"],
  "emotional_arc": "情绪轨迹描述（80字以内）",
  "highlights": ["高光时刻1", "高光时刻2"],
  "growth": "你的成长与蜕变（100字以内）",
  "message": "给明年的一句话寄语（30字以内）"
}}"""

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
                        "temperature": 0.8,
                        "max_tokens": 2000,
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

            # Cache the result
            try:
                start = accumulated.find("{")
                end = accumulated.rfind("}") + 1
                if start >= 0 and end > start:
                    parsed = json.loads(accumulated[start:end])

                    # Save as ReportRecord for profile export
                    report = ReportRecord(
                        user_id=user.id,
                        type="annual",
                        title=parsed.get("title", f"{report_year}年度灵魂报告"),
                        period=f"{report_year}",
                        content_html=json.dumps(parsed, ensure_ascii=False),
                    )
                    db.add(report)

                    # Cache in JournalInsightCache
                    cache = JournalInsightCache(
                        user_id=user.id,
                        insight_type="annual_report",
                        period_start=start_date,
                        period_end=end_date,
                        result_json=json.dumps(parsed, ensure_ascii=False),
                    )
                    db.add(cache)
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


@router.get("/cached-report")
def get_cached_report(
    type: str = Query("annual_report"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the most recent cached insight of a given type."""
    cached = (
        db.query(JournalInsightCache)
        .filter(JournalInsightCache.user_id == user.id)
        .filter(JournalInsightCache.insight_type == type)
        .order_by(JournalInsightCache.generated_at.desc())
        .first()
    )
    if not cached:
        return {"cached": None}
    return {
        "cached": {
            "type": cached.insight_type,
            "period": f"{cached.period_start} ~ {cached.period_end}",
            "result": json.loads(cached.result_json),
            "generated_at": cached.generated_at.isoformat() if cached.generated_at else None,
        },
    }
