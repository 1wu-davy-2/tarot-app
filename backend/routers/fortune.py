"""Daily fortune / zodiac horoscope with AI cache and scheduled generation."""
import asyncio
import json
import threading
import httpx
from datetime import date, timedelta, datetime
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database import get_db, SessionLocal
from models import User, FortuneCache, CompatibilityCache, DailyCardCache
from routers.interpret import hash_string, to_int32
from routers.auth import get_current_user_optional
from config import get_settings

router = APIRouter(prefix="/api/fortune", tags=["fortune"])
settings = get_settings()

ZODIAC_NAMES = [
    "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
    "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
]
ZODIAC_EMOJI = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

PERIOD_LABELS = {"daily": "今日", "weekly": "本周", "monthly": "本月", "yearly": "本年"}
PERIOD_HINTS = {
    "daily": "请针对这一天给出运势",
    "weekly": "请给出7天的整体趋势和每日要点",
    "monthly": "请给出30天的月度趋势和关键节点",
    "yearly": "请给出12个月的年度趋势和各月主题",
}

# ── Date key helpers ──

def _monday_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())

def _period_date_key(period: str, ref_date: date | None = None) -> str:
    """Return the canonical date_key for a period."""
    d = ref_date or date.today()
    if period == "daily":
        return d.isoformat()
    elif period == "weekly":
        return _monday_of_week(d).isoformat()
    elif period == "monthly":
        return d.replace(day=1).isoformat()
    elif period == "yearly":
        return d.replace(month=1, day=1).isoformat()
    return d.isoformat()


# ── Cache-first SSE endpoint ──

_CACHE_STREAM_DELAY = 1.0   # seconds between chunks (~30 chars each)
_CACHE_CHUNK_SIZE = 30     # characters per chunk
_INITIAL_PAUSE = 2.0       # initial "thinking" delay before streaming

@router.post("/cached")
async def cached_fortune(
    zodiac: str = Query(""),
    period: str = Query("daily"),
    date: str = Query(""),
    gender: str = Query(""),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get fortune from cache, stream via SSE. Falls back to live AI if no cache."""
    import traceback
    try:
        return await _cached_fortune_impl(zodiac, period, date, db=db, user=user)
    except HTTPException:
        raise
    except Exception as e:
        with open("fortune_error.log", "w") as f:
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=f"Error: {e}")


async def _cached_fortune_impl(
    zodiac: str,
    period: str,
    date_str: str,
    db: Session,
    user: User | None = None,
):
    from datetime import date as date_cls
    if zodiac not in ZODIAC_NAMES:
        raise HTTPException(status_code=400, detail="无效的星座名称")
    if period not in ("daily", "weekly", "monthly", "yearly"):
        raise HTTPException(status_code=400, detail="无效的周期类型")

    ref_date = date_cls.fromisoformat(date_str) if date_str else date_cls.today()
    date_key = _period_date_key(period, ref_date)

    # 1. Try cache first
    cached = db.query(FortuneCache).filter(
        FortuneCache.zodiac == zodiac,
        FortuneCache.period == period,
        FortuneCache.date_key == date_key,
    ).first()

    if cached:
        try:
            return _stream_cached_response(cached.response_json)
        except Exception as e:
            with open("fortune_error.log", "w") as f:
                import traceback
                traceback.print_exc(file=f)
            raise HTTPException(status_code=500, detail=f"Cache stream error: {e}")

    # 2. Fallback to live AI — consume quota only for authenticated users
    if user and hasattr(user, "id"):
        if not _consume_fortune_quota(user.id, db):
            raise HTTPException(status_code=429, detail="今日运势AI次数已用完")

    try:
        return await _stream_live_ai(zodiac, period, ref_date)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Live AI error: {e}")


def _stream_cached_response(response_json: str):
    """Stream stored JSON as SSE chunks mimicking real-time AI output."""

    async def event_stream():
        # Initial "thinking" pause
        await asyncio.sleep(_INITIAL_PAUSE)
        # Stream the AI response ~30 chars per second
        text = response_json
        i = 0
        while i < len(text):
            chunk = text[i:i + _CACHE_CHUNK_SIZE]
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            i += _CACHE_CHUNK_SIZE
            await asyncio.sleep(_CACHE_STREAM_DELAY)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


async def _stream_live_ai(zodiac: str, period: str, ref_date: date):
    """Real-time AI call with SSE stream, then cache the result."""
    target_date = ref_date.strftime("%Y年%m月%d日")
    period_label = PERIOD_LABELS.get(period, "今日")
    period_hint = PERIOD_HINTS.get(period, "")

    prompt = f"""你是命运之镜的运势占卜师，请为一位{zodiac}用户生成{period_label}运势解读。
日期：{target_date}
{period_hint}

请严格用以下JSON格式回复（不要markdown代码块，直接输出JSON）：
{{
  "summary": "一句话运势总结（15字以内，温暖治愈风）",
  "interpretation": "{period_label}运势详细解读（80-120字），结合星座特点给出个性化建议",
  "advice": "行动建议（40字以内）",
  "warning": "避坑提醒（30字以内）",
  "mood": "运势关键词（2-3个词）"
}}"""

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
                        "model": settings.deepseek_model,
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
            yield f"data: {json.dumps({'error': '运势生成超时，请稍后重试'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI服务连接失败：{str(e)}'}, ensure_ascii=False)}\n\n"

        # Cache the result for future requests
        if accumulated:
            try:
                date_key = _period_date_key(period, ref_date)
                _save_to_cache(zodiac, period, date_key, accumulated)
            except Exception:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


def _consume_fortune_quota(user_id: int, db: Session) -> bool:
    """Deduct one quota for fortune AI reading. Returns True if consumed."""
    try:
        from models import DailyQuota
        from routers.checkin import get_or_create_quota
        dq = get_or_create_quota(user_id, db)
        remaining = dq.base_quota + dq.bonus_quota + (dq.gifted_quota or 0) - dq.used_count
        if remaining > 0:
            dq.used_count += 1
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"[fortune_quota] Consume failed: {e}")
        db.rollback()
        return False


def _save_to_cache(zodiac: str, period: str, date_key: str, response_json: str):
    """Save fortune to DB cache (sync helper)."""
    db = SessionLocal()
    try:
        # Upsert: replace existing cache for this key
        existing = db.query(FortuneCache).filter(
            FortuneCache.zodiac == zodiac,
            FortuneCache.period == period,
            FortuneCache.date_key == date_key,
        ).first()
        if existing:
            existing.response_json = response_json
        else:
            db.add(FortuneCache(
                zodiac=zodiac,
                period=period,
                date_key=date_key,
                response_json=response_json,
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[fortune_cache] Save failed: {e}")
    finally:
        db.close()


# ── Batch cache generation (one AI call per zodiac, generates all 4 periods) ──

_GENERATE_LOCK = threading.Lock()

def generate_all_cache(for_date: date | None = None):
    """Generate fortune cache for all 12 zodiacs × 4 periods.

    Each zodiac gets ONE AI call that returns all 4 periods at once.
    This runs synchronously in a background thread.
    """
    ref_date = for_date or date.today()
    print(f"[fortune_cache] Starting batch generation for {ref_date.isoformat()}")

    for zodiac in ZODIAC_NAMES:
        try:
            _generate_one_zodiac(zodiac, ref_date)
        except Exception as e:
            print(f"[fortune_cache] Failed for {zodiac}: {e}")

    print(f"[fortune_cache] Batch generation complete ({len(ZODIAC_NAMES)} zodiacs)")


def _generate_one_zodiac(zodiac: str, ref_date: date):
    """Call AI once to generate all 4 period fortunes for one zodiac."""
    today_str = ref_date.strftime("%Y年%m月%d日")
    week_start = _monday_of_week(ref_date).strftime("%Y年%m月%d日")
    week_end = (_monday_of_week(ref_date) + timedelta(days=6)).strftime("%Y年%m月%d日")
    month_start = ref_date.replace(day=1).strftime("%Y年%m月%d日")
    month_end = (ref_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    year_str = ref_date.strftime("%Y年")

    prompt = f"""你是命运之镜的运势占卜师。请为一位{zodiac}用户生成运势解读。

当前日期：{today_str}
本周：{week_start} 至 {week_end}
本月：{month_start} 至 {month_end.strftime("%Y年%m月%d日")}
本年：{year_str}

请一次性生成四个周期的运势，用以下JSON格式回复（不要markdown代码块，直接输出纯JSON）：

{{
  "daily": {{ "summary": "今日运势一句话（15字内）", "interpretation": "今日详细解读（80-120字）", "advice": "今日行动建议（40字内）", "warning": "今日避坑提醒（30字内）", "mood": "今日关键词（2-3个词）" }},
  "weekly": {{ "summary": "本周运势一句话（15字内）", "interpretation": "本周详细解读（80-120字）", "advice": "本周行动建议（40字内）", "warning": "本周避坑提醒（30字内）", "mood": "本周关键词（2-3个词）" }},
  "monthly": {{ "summary": "本月运势一句话（15字内）", "interpretation": "本月详细解读（80-120字）", "advice": "本月行动建议（40字内）", "warning": "本月避坑提醒（30字内）", "mood": "本月关键词（2-3个词）" }},
  "yearly": {{ "summary": "本年运势一句话（15字内）", "interpretation": "本年详细解读（80-120字）", "advice": "本年行动建议（40字内）", "warning": "本年避坑提醒（30字内）", "mood": "本年关键词（2-3个词）" }}
}}"""

    print(f"[fortune_cache] Generating for {zodiac}...")

    # Use httpx sync call (we're in a thread)
    with httpx.Client(timeout=120) as client:
        response = client.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.deepseek_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8,
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

    if not content:
        print(f"[fortune_cache] Empty response for {zodiac}")
        return

    # Clean markdown code block if present
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:]) if len(lines) > 1 else content
    if content.endswith("```"):
        content = content[:-3].strip()

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        print(f"[fortune_cache] Failed to parse AI response for {zodiac}: {content[:100]}")
        return

    # Save each period
    for period in ("daily", "weekly", "monthly", "yearly"):
        period_data = parsed.get(period)
        if not period_data:
            continue
        date_key = _period_date_key(period, ref_date)
        _save_to_cache(zodiac, period, date_key, json.dumps(period_data, ensure_ascii=False))
        print(f"[fortune_cache] Saved {zodiac}/{period}/{date_key}")

    print(f"[fortune_cache] ✓ {zodiac} done")


# ── Scheduler ──

_scheduler_started = False

def _scheduler_loop():
    """Run cache generation every night shortly after midnight."""
    import time as time_module
    while True:
        now = datetime.now()
        # Next run: 00:05 tomorrow
        next_run = now.replace(hour=0, minute=5, second=0, microsecond=0)
        if now >= next_run:
            next_run = next_run + timedelta(days=1)
        wait_seconds = (next_run - now).total_seconds()
        print(f"[fortune_scheduler] Next run at {next_run.isoformat()} (sleep {wait_seconds:.0f}s)")
        time_module.sleep(wait_seconds)

        try:
            with _GENERATE_LOCK:
                generate_all_cache()
            # Also pre-generate daily card sentence
            generate_daily_card_sentence()
        except Exception as e:
            print(f"[fortune_scheduler] Error: {e}")


def start_fortune_scheduler():
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True
    t = threading.Thread(target=_scheduler_loop, daemon=True)
    t.start()
    print("[fortune_scheduler] Started (daily at 00:05)")


# ── Admin trigger endpoint ──

@router.post("/generate-cache")
def trigger_cache_generation(
    user: User | None = Depends(get_current_user_optional),
):
    """Manually trigger cache generation for all zodiacs (admin or scheduled)."""
    # Run in background thread so the request returns immediately
    t = threading.Thread(target=lambda: generate_all_cache(), daemon=True)
    t.start()
    return {"ok": True, "message": "Cache generation started in background"}


# ── Cache status endpoint ──

@router.get("/cache-status")
def cache_status(
    date_str: str = Query(""),
    db: Session = Depends(get_db),
):
    """Check which zodiacs/periods are cached for a given date."""
    ref_date = date.fromisoformat(date_str) if date_str else date.today()
    status = {}
    for zodiac in ZODIAC_NAMES:
        zodiac_status = {}
        for period in ("daily", "weekly", "monthly", "yearly"):
            date_key = _period_date_key(period, ref_date)
            cached = db.query(FortuneCache).filter(
                FortuneCache.zodiac == zodiac,
                FortuneCache.period == period,
                FortuneCache.date_key == date_key,
            ).first()
            zodiac_status[period] = bool(cached)
        status[zodiac] = zodiac_status

    total = sum(v for z in status.values() for v in z.values())
    return {
        "date": ref_date.isoformat(),
        "total_cached": total,
        "total_expected": len(ZODIAC_NAMES) * 4,
        "zodiacs": status,
    }


# ── Legacy endpoints (kept for backward compat) ──

@router.post("/daily")
async def daily_fortune_legacy(
    zodiac: str = Query(""),
    date: str = Query(""),
    gender: str = Query(""),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Legacy daily endpoint — delegates to cached."""
    return await cached_fortune(zodiac=zodiac, period="daily", date=date, gender=gender, user=user, db=db)


@router.post("/period")
async def period_fortune_legacy(
    zodiac: str = Query(""),
    period: str = Query("weekly"),
    gender: str = Query(""),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Legacy period endpoint — delegates to cached."""
    return await cached_fortune(zodiac=zodiac, period=period, gender=gender, user=user, db=db)


@router.get("/quota-remaining")
def fortune_quota_remaining(
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Check if user has remaining fortune quota for today."""
    if not user or not hasattr(user, "id"):
        return {"remaining": -1, "note": "guest — no quota tracking"}
    from models import DailyQuota
    today_str = date.today().isoformat()
    dq = db.query(DailyQuota).filter(
        DailyQuota.user_id == user.id,
        DailyQuota.date == today_str,
    ).first()
    if not dq:
        return {"remaining": 2, "used": 0, "note": "no record yet"}
    remaining = dq.base_quota + dq.bonus_quota + (dq.gifted_quota or 0) - dq.used_count
    return {
        "remaining": max(0, remaining),
        "used": dq.used_count,
        "base": dq.base_quota,
        "bonus": dq.bonus_quota,
        "gifted": dq.gifted_quota,
    }


@router.get("/zodiac-list")
def zodiac_list():
    """Return list of zodiac signs with emojis."""
    return [{"name": n, "emoji": e, "index": i} for i, (n, e) in enumerate(zip(ZODIAC_NAMES, ZODIAC_EMOJI))]


# ── Daily Card One-Sentence ──

TAROT_NAMES_CN = [
    "愚者", "魔术师", "女祭司", "女皇", "皇帝", "教皇", "恋人", "战车",
    "力量", "隐者", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔",
    "高塔", "星星", "月亮", "太阳", "审判", "世界",
    # Minor Arcana — Wands
    "权杖王牌", "权杖二", "权杖三", "权杖四", "权杖五", "权杖六", "权杖七",
    "权杖八", "权杖九", "权杖十", "权杖侍从", "权杖骑士", "权杖皇后", "权杖国王",
    # Cups
    "圣杯王牌", "圣杯二", "圣杯三", "圣杯四", "圣杯五", "圣杯六", "圣杯七",
    "圣杯八", "圣杯九", "圣杯十", "圣杯侍从", "圣杯骑士", "圣杯皇后", "圣杯国王",
    # Swords
    "宝剑王牌", "宝剑二", "宝剑三", "宝剑四", "宝剑五", "宝剑六", "宝剑七",
    "宝剑八", "宝剑九", "宝剑十", "宝剑侍从", "宝剑骑士", "宝剑皇后", "宝剑国王",
    # Pentacles
    "星币王牌", "星币二", "星币三", "星币四", "星币五", "星币六", "星币七",
    "星币八", "星币九", "星币十", "星币侍从", "星币骑士", "星币皇后", "星币国王",
]

TAROT_NAMES_EN = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
    # Wands
    "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
    "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
    "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
    # Cups
    "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
    "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
    "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
    # Swords
    "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
    "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
    "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
    # Pentacles
    "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles",
    "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
    "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles",
]


def _get_daily_card():
    """Get today's deterministic tarot card (same as frontend getDailyCard())."""
    today = date.today()
    date_str = today.isoformat()
    seed = hash_string(date_str)
    card_index = seed % 78
    is_reversed = (seed % 2) == 1
    card_cn = TAROT_NAMES_CN[card_index] if card_index < len(TAROT_NAMES_CN) else f"牌#{card_index}"
    card_en = TAROT_NAMES_EN[card_index] if card_index < len(TAROT_NAMES_EN) else f"Card #{card_index}"
    return {"date_str": date_str, "card_index": card_index, "is_reversed": is_reversed, "card_cn": card_cn, "card_en": card_en}


def generate_daily_card_sentence():
    """Generate AI one-sentence daily card guidance. Non-blocking sync call via DeepSeek."""
    info = _get_daily_card()
    date_str = info["date_str"]

    db = SessionLocal()
    try:
        existing = db.query(DailyCardCache).filter(DailyCardCache.date == date_str).first()
        if existing:
            print(f"[daily_card] Already cached for {date_str}: {existing.sentence}")
            return existing.sentence
    finally:
        db.close()

    orientation = "逆位（相反含义/内在反思）" if info["is_reversed"] else "正位（正向含义/外在行动）"
    prompt = f"""你是命运之镜的每日塔罗指引师。今天（{date_str}）的每日牌是：{info['card_cn']}（{info['card_en']}），牌位：{orientation}。

请写一句温暖而富有诗意的今日指引（15字以内，中文），直接输出句子，不要引号、标点、解释或任何额外内容。"""

    try:
        import httpx
        resp = httpx.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.deepseek_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.9,
                "max_tokens": 50,
                "stream": False,
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        sentence = data["choices"][0]["message"]["content"].strip()
        # Clean any quotes or extra characters
        sentence = sentence.strip('"\'""''「」『』。，！？、')
        sentence = sentence[:120]
        print(f"[daily_card] AI generated for {date_str}: {sentence}")
    except Exception as e:
        print(f"[daily_card] AI failed for {date_str}: {e}")
        # Fallback to static
        orientation_word = "逆位" if info["is_reversed"] else "正位"
        sentence = f"今日{info['card_cn']} {orientation_word}，指引你前行"

    # Save to cache
    db = SessionLocal()
    try:
        cache = DailyCardCache(
            date=date_str,
            card_index=info["card_index"],
            is_reversed=info["is_reversed"],
            sentence=sentence,
        )
        db.add(cache)
        db.commit()
        print(f"[daily_card] Cached for {date_str}")
    except Exception as e:
        db.rollback()
        print(f"[daily_card] Cache save failed: {e}")
    finally:
        db.close()

    return sentence


@router.get("/daily-card-sentence")
def daily_card_sentence(db: Session = Depends(get_db)):
    """Return today's daily card with AI one-sentence guidance (cached)."""
    info = _get_daily_card()
    date_str = info["date_str"]

    cached = db.query(DailyCardCache).filter(DailyCardCache.date == date_str).first()
    if cached:
        return {
            "date": date_str,
            "card_index": cached.card_index,
            "is_reversed": cached.is_reversed,
            "card_name_cn": info["card_cn"],
            "card_name_en": info["card_en"],
            "sentence": cached.sentence,
        }

    # Generate on demand if not cached
    sentence = generate_daily_card_sentence()
    return {
        "date": date_str,
        "card_index": info["card_index"],
        "is_reversed": info["is_reversed"],
        "card_name_cn": info["card_cn"],
        "card_name_en": info["card_en"],
        "sentence": sentence,
    }


# ── Compatibility endpoint ──

def _save_compatibility_cache(zodiac_a: str, zodiac_b: str, date_key: str, response_json: str):
    """Save compatibility reading to DB cache (sync helper)."""
    db = SessionLocal()
    try:
        existing = db.query(CompatibilityCache).filter(
            CompatibilityCache.zodiac_a == zodiac_a,
            CompatibilityCache.zodiac_b == zodiac_b,
            CompatibilityCache.date_key == date_key,
        ).first()
        if existing:
            existing.response_json = response_json
        else:
            db.add(CompatibilityCache(
                zodiac_a=zodiac_a,
                zodiac_b=zodiac_b,
                date_key=date_key,
                response_json=response_json,
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[compat_cache] Save failed: {e}")
    finally:
        db.close()


async def _stream_live_compatibility(
    user_zodiac: str,
    partner_zodiac: str,
    partner_gender: str,
    partner_birth_date: str,
    partner_birth_time: str,
    partner_birth_place: str,
    ref_date: date,
):
    """Real-time AI compatibility analysis with SSE stream, then cache."""
    gender_label = "男" if partner_gender == "male" else "女"
    target_date = ref_date.strftime("%Y年%m月%d日")
    place_line = f"对象出生地点：{partner_birth_place}" if partner_birth_place else ""

    prompt = f"""你是命运之镜的情感占星师。请为以下两人进行星座配对（合盘）分析：

用户星座：{user_zodiac}
对象星座：{partner_zodiac}
对象性别：{gender_label}
对象出生日期：{partner_birth_date}
对象出生时间：{partner_birth_time}
{place_line}

请从多个维度分析两人配对情况，严格用以下JSON格式回复（不要markdown代码块，直接输出纯JSON）：

{{
  "summary": "配对总结（15字以内，温暖治愈风）",
  "compatibility_score": 85,
  "love_match": "感情契合度分析（60-80字）",
  "communication": "沟通模式分析（50-70字）",
  "challenges": "潜在挑战与注意事项（40-60字）",
  "advice": "给两人的相处建议（50字以内）",
  "mood": "配对关键词（2-3个词）"
}}"""

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
                        "model": settings.deepseek_model,
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
            yield f"data: {json.dumps({'error': '配对分析超时，请稍后重试'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI服务连接失败：{str(e)}'}, ensure_ascii=False)}\n\n"

        # Cache the result
        if accumulated:
            try:
                date_key = ref_date.isoformat()
                _save_compatibility_cache(user_zodiac, partner_zodiac, date_key, accumulated)
            except Exception:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/compatibility")
async def compatibility_fortune(
    user_zodiac: str = Query(""),
    partner_zodiac: str = Query(""),
    partner_gender: str = Query(""),
    partner_birth_date: str = Query(""),
    partner_birth_time: str = Query(""),
    partner_birth_place: str = Query(""),
    date_str: str = Query("", alias="date"),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get zodiac compatibility analysis, stream via SSE. Cache-first, fallback to live AI."""
    if user_zodiac not in ZODIAC_NAMES:
        raise HTTPException(status_code=400, detail="无效的用户星座名称")
    if partner_zodiac not in ZODIAC_NAMES:
        raise HTTPException(status_code=400, detail="无效的对象星座名称")

    ref_date = date.fromisoformat(date_str) if date_str else date.today()
    date_key = ref_date.isoformat()

    # Check cache first (order-independent: A-B same as B-A)
    cached = db.query(CompatibilityCache).filter(
        or_(
            and_(CompatibilityCache.zodiac_a == user_zodiac, CompatibilityCache.zodiac_b == partner_zodiac),
            and_(CompatibilityCache.zodiac_a == partner_zodiac, CompatibilityCache.zodiac_b == user_zodiac),
        ),
        CompatibilityCache.date_key == date_key,
    ).first()

    if cached:
        return _stream_cached_response(cached.response_json)

    # Consume quota only for live AI calls
    if user and hasattr(user, "id"):
        if not _consume_fortune_quota(user.id, db):
            raise HTTPException(status_code=429, detail="今日运势AI次数已用完")

    return await _stream_live_compatibility(
        user_zodiac=user_zodiac,
        partner_zodiac=partner_zodiac,
        partner_gender=partner_gender,
        partner_birth_date=partner_birth_date,
        partner_birth_time=partner_birth_time,
        partner_birth_place=partner_birth_place,
        ref_date=ref_date,
    )

