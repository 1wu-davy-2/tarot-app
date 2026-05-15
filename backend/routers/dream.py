"""Dream interpretation endpoint with SSE streaming and journal storage."""
import json
import httpx
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import User, DreamRecord
from routers.auth import get_current_user_optional
from routers.fortune import _consume_fortune_quota
from config import get_settings

router = APIRouter(prefix="/api/fortune", tags=["dream"])
settings = get_settings()

ZODIAC_NAMES = [
    "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
    "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
]

MOON_PHASE_HINTS: dict[str, str] = {
    "新月": "此时适合开启新计划，梦境往往预示未来的方向",
    "满月": "满月之夜梦境最为活跃，潜意识信息最强烈，适合释放与总结",
    "蛾眉月": "梦境可能暗示成长中的机会，注意细节",
    "上弦月": "挑战与选择在梦中浮现，是行动前的内心预演",
    "亏月": "适合反思与内省，梦境揭示需要放下的事物",
    "残月": "能量回收期，梦境可能指向需要休息和恢复的领域",
}


def _save_dream_record(
    user_id: int | None,
    date_str: str,
    dream_text: str,
    ai_response: str,
    moon_phase: str = "",
    mood: int | None = None,
):
    """Save dream record to database."""
    db = SessionLocal()
    try:
        tags = _extract_dream_tags(dream_text)
        record = DreamRecord(
            user_id=user_id if user_id else None,
            date=date_str,
            dream_text=dream_text,
            ai_response=ai_response,
            moon_phase=moon_phase,
            mood=mood,
            tags=",".join(tags[:5]),
        )
        db.add(record)
        db.commit()
        print(f"[dream] Saved record for user {user_id} on {date_str}")
    except Exception as e:
        db.rollback()
        print(f"[dream] Save record failed: {e}")
    finally:
        db.close()


def _extract_dream_tags(dream_text: str) -> list[str]:
    """Extract simple category tags from dream text."""
    tag_map = {
        "坠落": "坠落", "飞翔": "飞翔", "追逐": "追逐", "水": "水",
        "火": "火", "死亡": "死亡", "考试": "考试", "蛇": "动物",
        "龙": "动物", "鱼": "动物", "婴儿": "人物", "婚礼": "场景",
        "飞": "飞翔", "跑": "追逐", "鬼": "超自然", "钱": "财富",
        "血": "身体", "牙": "身体", "门": "场景", "路": "场景",
        "海": "自然", "山": "自然", "花": "自然", "树": "自然",
        "雨": "自然", "雪": "自然",
    }
    found = []
    for kw, tag in tag_map.items():
        if kw in dream_text and tag not in found:
            found.append(tag)
        if len(found) >= 5:
            break
    return found if found else ["其他"]


def _get_recent_dreams_text(user_id: int, limit: int = 3) -> str:
    """Get summary text of recent dreams (within 15 days) for context injection."""
    db = SessionLocal()
    try:
        cutoff = date.today().strftime("%Y-%m-%d")
        fifteen_ago = (date.today() - timedelta(days=15)).strftime("%Y-%m-%d")
        records = (
            db.query(DreamRecord)
            .filter(DreamRecord.user_id == user_id)
            .filter(DreamRecord.date >= fifteen_ago)
            .order_by(DreamRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        if not records:
            return ""
        lines = []
        for i, r in enumerate(reversed(records)):
            # Try to extract title from ai_response
            title = r.dream_text[:30]
            if r.ai_response:
                try:
                    parsed = json.loads(r.ai_response)
                    title = parsed.get("title", title)
                except Exception:
                    pass
            mood_label = ""
            if r.mood:
                mood_emoji = ["", "😴", "😰", "😐", "🙂", "😊"][r.mood]
                mood_label = f" 醒来情绪：{mood_emoji}"
            lines.append(f"第{i+1}次 · {r.date} · {title}{mood_label}")
        return "\n".join(lines)
    finally:
        db.close()


@router.get("/dreams/recent")
def recent_dreams(
    limit: int = Query(3, ge=1, le=10),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get the most recent N dream records within last 15 days."""
    if not user or not hasattr(user, "id"):
        return {"dreams": [], "total": 0}
    cutoff = (date.today() - timedelta(days=15)).strftime("%Y-%m-%d")
    records = (
        db.query(DreamRecord)
        .filter(DreamRecord.user_id == user.id)
        .filter(DreamRecord.date >= cutoff)
        .order_by(DreamRecord.created_at.desc())
        .limit(limit)
        .all()
    )
    total = db.query(DreamRecord).filter(
        DreamRecord.user_id == user.id,
        DreamRecord.date >= cutoff,
    ).count()
    return {
        "total": total,
        "dreams": [
            {
                "id": r.id,
                "date": r.date,
                "dream_text": r.dream_text[:120],
                "moon_phase": r.moon_phase,
                "mood": r.mood,
                "tags": r.tags.split(",") if r.tags else [],
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
    }


@router.post("/dream")
async def dream_interpretation(
    dream_text: str = Query(""),
    moon_phase: str = Query(""),
    zodiac: str = Query(""),
    mood: int = Query(0),
    date_str: str = Query("", alias="date"),
    recent_ids: str = Query(""),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Interpret a dream via AI, stream via SSE. Saves to dream journal."""
    dream_text = dream_text.strip()
    if not dream_text:
        raise HTTPException(status_code=400, detail="梦境描述不能为空")
    if len(dream_text) > 2000:
        raise HTTPException(status_code=400, detail="梦境描述过长（最多2000字）")

    if zodiac and zodiac not in ZODIAC_NAMES:
        zodiac = ""

    ref_date = date.fromisoformat(date_str) if date_str else date.today()
    user_id = user.id if (user and hasattr(user, "id")) else None

    # Consume quota
    if user_id:
        _consume_fortune_quota(user_id, db)

    # Build recent dreams context
    recent_context = ""
    if user_id:
        recent_context = _get_recent_dreams_text(user_id, limit=3)

    return await _stream_and_save_dream(
        dream_text=dream_text,
        moon_phase=moon_phase,
        zodiac=zodiac,
        ref_date=ref_date,
        user_id=user_id,
        mood_val=mood if mood > 0 else None,
        recent_context=recent_context,
    )


async def _stream_and_save_dream(
    dream_text: str,
    moon_phase: str,
    zodiac: str,
    ref_date: date,
    user_id: int | None,
    mood_val: int | None,
    recent_context: str = "",
):
    """Stream AI dream interpretation. Save record immediately with empty response, update after stream."""
    # Save placeholder record first (so it's in DB even if stream fails)
    record_id: int | None = None
    db = SessionLocal()
    try:
        tags = _extract_dream_tags(dream_text)
        record = DreamRecord(
            user_id=user_id if user_id else None,
            date=ref_date.isoformat(),
            dream_text=dream_text,
            ai_response="",
            moon_phase=moon_phase,
            mood=mood_val,
            tags=",".join(tags[:5]),
        )
        db.add(record)
        db.commit()
        record_id = record.id
        print(f"[dream] Placeholder saved: user={user_id} id={record_id}")
    except Exception as e:
        db.rollback()
        print(f"[dream] Placeholder save failed: {e}")
    finally:
        db.close()

    target_date = ref_date.strftime("%Y年%m月%d日")
    zodiac_line = f"用户星座：{zodiac}" if zodiac else ""
    moon_hint = MOON_PHASE_HINTS.get(moon_phase, "")
    moon_line = f"月相：{moon_phase}。{moon_hint}" if moon_phase else ""

    recent_line = ""
    if recent_context:
        recent_line = f"""
用户近期的梦境记录：
{recent_context}

请结合上述近期梦境的趋势，分析本次梦境与之前梦境的关联或变化。"""

    prompt = f"""你是命运之镜的解梦师，擅长用温暖、有洞察力的语言解读梦境。

梦境内容：{dream_text}
日期：{target_date}
{zodiac_line}
{moon_line}{recent_line}

请从心理学和传统解梦的角度，综合分析梦境的象征意义和潜意识信息。严格用以下JSON格式回复（不要markdown代码块，直接输出纯JSON）：

{{
  "title": "梦境主题（10字以内，诗意概括）",
  "interpretation": "整体解读（80-120字），温暖洞察风，结合可能的潜意识信息",
  "symbols": "2-3个关键象征符号及其含义（60字以内）",
  "subconscious": "潜意识映射分析（50-70字），这个梦可能反映了什么内心状态",
  "advice": "醒来后的行动建议（40字以内）",
  "mood": "梦境情绪关键词（2-3个词）",
  "positive_ratio": 65,
  "positive_action": "好的一面如何利用（30字以内）",
  "negative_action": "不好的一面如何化解（30字以内）",
  "dream_trend": "与近期梦境的趋势关联（25字以内，如无历史记录则写'首条记录'）"
}}

注意：positive_ratio 是 0-100 的整数，数值越高代表梦境越是吉兆或积极信号。"""

    async def event_stream():
        accumulated = ""
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
                                accumulated += content
                                yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
                        except json.JSONDecodeError:
                            pass

        except httpx.ReadTimeout:
            yield f"data: {json.dumps({'error': '解梦超时，请稍后重试'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI服务连接失败：{str(e)}'}, ensure_ascii=False)}\n\n"

        # Update record with AI response (runs on generator close/return)
        if accumulated and record_id:
            db2 = SessionLocal()
            try:
                existing = db2.query(DreamRecord).filter(DreamRecord.id == record_id).first()
                if existing:
                    existing.ai_response = accumulated
                    db2.commit()
                    print(f"[dream] AI response updated: id={record_id}")
            except Exception as e:
                db2.rollback()
                print(f"[dream] Update failed: {e}")
            finally:
                db2.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/dreams")
def list_dreams(
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """List dream records for the current user."""
    if not user or not hasattr(user, "id"):
        return {"dreams": []}
    records = (
        db.query(DreamRecord)
        .filter(DreamRecord.user_id == user.id)
        .order_by(DreamRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "dreams": [
            {
                "id": r.id,
                "date": r.date,
                "dream_text": r.dream_text[:200],
                "ai_response": r.ai_response,
                "moon_phase": r.moon_phase,
                "mood": r.mood,
                "tags": r.tags.split(",") if r.tags else [],
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    }


@router.get("/dreams/{dream_id}")
def get_dream_detail(
    dream_id: int,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get a single dream record with full detail."""
    if not user or not hasattr(user, "id"):
        raise HTTPException(status_code=401, detail="请先登录")
    record = db.query(DreamRecord).filter(
        DreamRecord.id == dream_id,
        DreamRecord.user_id == user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {
        "id": record.id,
        "date": record.date,
        "dream_text": record.dream_text,
        "ai_response": record.ai_response,
        "moon_phase": record.moon_phase,
        "mood": record.mood,
        "tags": record.tags.split(",") if record.tags else [],
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@router.delete("/dreams/{dream_id}")
def delete_dream(
    dream_id: int,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Delete a dream record."""
    if not user or not hasattr(user, "id"):
        raise HTTPException(status_code=401, detail="请先登录")
    record = db.query(DreamRecord).filter(
        DreamRecord.id == dream_id,
        DreamRecord.user_id == user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"ok": True}
