import json
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, DailyJournal, DailyQuota
from schemas import JournalCreate, JournalResponse, WeeklyReportRequest
from routers.auth import get_current_user
from routers.checkin import get_or_create_quota
from config import get_settings

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalResponse)
def save_journal_entry(
    req: JournalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(DailyJournal).filter(
        DailyJournal.user_id == user.id,
        DailyJournal.date == req.date,
    ).first()

    if existing:
        existing.card_id = req.card_id
        existing.is_reversed = req.is_reversed
        existing.mood = req.mood
        existing.note = req.note
        db.commit()
        db.refresh(existing)
        return existing

    entry = DailyJournal(
        user_id=user.id,
        date=req.date,
        card_id=req.card_id,
        is_reversed=req.is_reversed,
        mood=req.mood,
        note=req.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("")
def get_journal(
    date: str = Query(None),
    month: str = Query(None),
    start: str = Query(None),
    end: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(DailyJournal).filter(DailyJournal.user_id == user.id)

    if date:
        entry = query.filter(DailyJournal.date == date).first()
        return {"entry": entry}
    if start and end:
        entries = (
            query.filter(DailyJournal.date >= start, DailyJournal.date <= end)
            .order_by(DailyJournal.date.asc())
            .all()
        )
        return {"entries": entries}
    if month:
        entries = (
            query.filter(DailyJournal.date.like(f"{month}%"))
            .order_by(DailyJournal.date.asc())
            .all()
        )
        return {"entries": entries}

    raise HTTPException(status_code=400, detail="请提供 date、month 或 start+end 查询参数")


# ── Monthly Report ──

@router.post("/monthly-report")
async def monthly_report(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a monthly AI report from journal entries + birth chart data."""
    settings = get_settings()
    api_key = settings.deepseek_api_key

    if not api_key:
        return JSONResponse(
            {"error": "AI 服务尚未配置，请在 .env 中设置 DEEPSEEK_API_KEY。"},
            status_code=503,
        )

    body = await request.json()
    month = body.get("month", "")  # "YYYY-MM"
    if not month or not re.match(r"^\d{4}-\d{2}$", month):
        return JSONResponse({"error": "请提供有效的 month 参数（YYYY-MM）"}, status_code=400)

    # Query entries for the month
    entries = (
        db.query(DailyJournal)
        .filter(
            DailyJournal.user_id == user.id,
            DailyJournal.date.like(f"{month}%"),
        )
        .order_by(DailyJournal.date.asc())
        .all()
    )

    if len(entries) < 7:
        return JSONResponse(
            {"error": "至少需要7天日记记录才能生成月报"},
            status_code=400,
        )

    # Consume one quota for AI report generation
    from datetime import date as date_cls
    dq = get_or_create_quota(user.id, db)
    remaining = dq.base_quota + dq.bonus_quota + (dq.gifted_quota or 0) - dq.used_count
    if remaining <= 0 and not getattr(user, "is_admin", False):
        return JSONResponse({"error": "今日AI次数已用完，请签到获取更多"}, status_code=429)
    dq.used_count += 1
    db.commit()

    # Statistics
    element_counts = {}
    mood_counts = {}
    reversed_count = 0
    entry_summaries = []
    total = len(entries)

    for e in entries:
        name_cn, element, _, keywords = _get_card_meta(e.card_id)
        element_counts[element] = element_counts.get(element, 0) + 1
        if e.mood:
            mood_counts[e.mood] = mood_counts.get(e.mood, 0) + 1
        if e.is_reversed:
            reversed_count += 1

        reversed_str = "逆位" if e.is_reversed else "正位"
        note_str = f" — {e.note}" if e.note else ""
        mood_str = f" [心情：{MOOD_LABELS.get(e.mood, '')}]" if e.mood else ""
        entry_summaries.append(
            f"- {e.date}：{name_cn}（{reversed_str}）{mood_str}{note_str}"
        )

    element_lines = [
        f"- {ELEMENT_LABELS.get(el, el)}：{cnt}次（{cnt * 100 // total}%）"
        for el, cnt in sorted(element_counts.items(), key=lambda x: -x[1])
    ]
    mood_lines = [
        f"- {MOOD_LABELS.get(m, str(m))}：{cnt}天"
        for m, cnt in sorted(mood_counts.items(), key=lambda x: -x[1])
    ]
    upright_count = total - reversed_count

    # Birth chart context
    birth_context = ""
    if user.zodiac:
        birth_context += f"- 星座：{user.zodiac}\n"
    if user.birth_date:
        birth_context += f"- 出生日期：{user.birth_date}\n"
    if user.birth_time:
        birth_context += f"- 出生时间：{user.birth_time}\n"
    if user.birth_place:
        birth_context += f"- 出生地点：{user.birth_place}\n"

    # Month label
    month_parts = month.split("-")
    month_label = f"{month_parts[0]}年{int(month_parts[1])}月"

    system_prompt = """你是融合东西方智慧的资深塔罗解读师，也是一位善于从数据中发现规律的人生分析师。
你在为用户生成一个月的塔罗日记综合复盘报告。

要求：
- 语言温暖自然，像一位老朋友在帮你回顾这个月
- 结论前置，开篇直接给出本月最核心的发现
- 深度分析牌面元素分布与情绪波动的关联模式
- 指出跨周度的重复主题或趋势变化
- 若有出生星盘信息，结合星盘给出更有针对性的洞察
- 最后给出下月的行动指导
- 400-700字，Markdown 格式"""

    user_prompt = f"""## 本月日记概况
月份：{month_label}（共{total}天记录）

## 每日记录
{chr(10).join(entry_summaries)}

## 牌面元素分布
{chr(10).join(element_lines)}

## 正逆位比例
- 正位：{upright_count}次（{upright_count * 100 // total}%）
- 逆位：{reversed_count}次（{reversed_count * 100 // total}%）

## 心情分布
{chr(10).join(mood_lines) if mood_lines else "（暂无心情记录）"}

## 用户星盘信息
{birth_context if birth_context else "（尚未填写出生信息）"}

请基于以上数据，生成一份本月塔罗日记综合复盘报告。"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

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
                        "max_tokens": 3000,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        if response.status_code == 401:
                            msg = "AI 服务认证失败，请检查 DEEPSEEK_API_KEY。"
                        elif response.status_code == 429:
                            msg = "AI 服务请求过于频繁，请稍后重试。"
                        else:
                            msg = f"AI 服务暂时不可用（{response.status_code}）"
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
                yield f"data: {json.dumps({'error': '月报生成超时，请稍后重试。'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'AI 服务连接失败：{str(e)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(DailyJournal).filter(
        DailyJournal.id == entry_id,
        DailyJournal.user_id == user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="日记记录不存在")
    db.delete(entry)
    db.commit()
    return {"message": "已删除"}


# ── Weekly Report ──

MOOD_LABELS = {1: "开心", 2: "难过", 3: "生气", 4: "焦虑", 5: "思考"}
ELEMENT_LABELS = {"风": "Air / 风元素", "火": "Fire / 火元素", "水": "Water / 水元素", "土": "Earth / 土元素"}

# Card ID → metadata (mirrored from tarot-data.ts — major arcana + suit assignment)
def _get_card_meta(card_id: int):
    """Return nameCN, element, is_major, keywords for a card by its index."""
    major_cards = [
        (0, "愚者", "风", ["新的开始", "冒险", "天真"]),
        (1, "魔术师", "风", ["创造力", "技巧", "意志力"]),
        (2, "女祭司", "水", ["直觉", "潜意识", "内在智慧"]),
        (3, "女皇", "土", ["丰饶", "母性", "感官享受"]),
        (4, "皇帝", "火", ["权威", "结构", "掌控"]),
        (5, "教皇", "土", ["传统", "信仰", "指引"]),
        (6, "恋人", "风", ["选择", "关系", "和谐"]),
        (7, "战车", "水", ["胜利", "意志力", "前进"]),
        (8, "力量", "火", ["勇气", "耐心", "内在力量"]),
        (9, "隐士", "土", ["内省", "孤独", "智慧"]),
        (10, "命运之轮", "火", ["命运", "转折点", "机遇"]),
        (11, "正义", "风", ["公平", "真理", "因果"]),
        (12, "倒吊人", "水", ["牺牲", "全新视角", "放手"]),
        (13, "死神", "水", ["结束", "转变", "重生"]),
        (14, "节制", "火", ["平衡", "调和", "中庸"]),
        (15, "恶魔", "土", ["束缚", "欲望", "阴影"]),
        (16, "塔", "火", ["崩塌", "觉醒", "解放"]),
        (17, "星星", "风", ["希望", "疗愈", "信念"]),
        (18, "月亮", "水", ["恐惧", "幻象", "潜意识"]),
        (19, "太阳", "火", ["喜悦", "成功", "生命力"]),
        (20, "审判", "火", ["觉醒", "召唤", "了结"]),
        (21, "世界", "土", ["完成", "整合", "旅行"]),
    ]
    minor_suits = {22: "wands", 36: "cups", 50: "swords", 64: "pentacles"}
    suit_names = {"wands": "权杖", "cups": "圣杯", "swords": "宝剑", "pentacles": "星币"}
    suit_elements = {"wands": "火", "cups": "水", "swords": "风", "pentacles": "土"}
    rank_names = {1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九", 10: "十", 11: "侍从", 12: "骑士", 13: "皇后", 14: "国王"}

    if 0 <= card_id <= 21:
        _, name, element, keywords = major_cards[card_id]
        return name, element, True, keywords

    suit_key = None
    for start_id in sorted(minor_suits.keys(), reverse=True):
        if card_id >= start_id:
            suit_key = minor_suits[start_id]
            break
    if suit_key is None:
        return "未知", "未知", False, []

    rank = card_id - min(k for k, v in minor_suits.items() if v == suit_key) + 1
    name = f"{suit_names[suit_key]}{rank_names.get(rank, str(rank))}"
    element = suit_elements[suit_key]
    return name, element, False, []


@router.post("/weekly-report")
async def weekly_report(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a weekly AI report from journal entries + birth chart data."""
    settings = get_settings()
    api_key = settings.deepseek_api_key

    if not api_key:
        return JSONResponse(
            {"error": "AI 服务尚未配置，请在 .env 中设置 DEEPSEEK_API_KEY。"},
            status_code=503,
        )

    body = await request.json()
    try:
        req = WeeklyReportRequest(**body)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    # Query entries in the date range
    entries = (
        db.query(DailyJournal)
        .filter(
            DailyJournal.user_id == user.id,
            DailyJournal.date >= req.start_date,
            DailyJournal.date <= req.end_date,
        )
        .order_by(DailyJournal.date.asc())
        .all()
    )

    if len(entries) < 3:
        return JSONResponse(
            {"error": "至少需要3天日记记录才能生成周报"},
            status_code=400,
        )

    # Consume one quota for AI report generation
    dq = get_or_create_quota(user.id, db)
    remaining = dq.base_quota + dq.bonus_quota + (dq.gifted_quota or 0) - dq.used_count
    if remaining <= 0 and not getattr(user, "is_admin", False):
        return JSONResponse({"error": "今日AI次数已用完，请签到获取更多"}, status_code=429)
    dq.used_count += 1
    db.commit()

    # Compute statistics
    element_counts = {}
    mood_counts = {}
    entry_summaries = []
    total_entries = len(entries)

    for e in entries:
        name_cn, element, _, keywords = _get_card_meta(e.card_id)
        element_counts[element] = element_counts.get(element, 0) + 1
        if e.mood:
            mood_counts[e.mood] = mood_counts.get(e.mood, 0) + 1

        reversed_str = "逆位" if e.is_reversed else "正位"
        note_str = f" — {e.note}" if e.note else ""
        mood_str = f" [心情：{MOOD_LABELS.get(e.mood, '')}]" if e.mood else ""
        entry_summaries.append(
            f"- {e.date}：{name_cn}（{reversed_str}）{mood_str}{note_str}"
        )

    # Element breakdown
    element_lines = [
        f"- {ELEMENT_LABELS.get(el, el)}：{cnt}次（{cnt * 100 // total_entries}%）"
        for el, cnt in sorted(element_counts.items(), key=lambda x: -x[1])
    ]

    # Mood breakdown
    mood_lines = [
        f"- {MOOD_LABELS.get(m, str(m))}：{cnt}天"
        for m, cnt in sorted(mood_counts.items(), key=lambda x: -x[1])
    ]

    # Birth chart context
    birth_context = ""
    if user.zodiac:
        birth_context += f"- 星座：{user.zodiac}\n"
    if user.birth_date:
        birth_context += f"- 出生日期：{user.birth_date}\n"
    if user.birth_time:
        birth_context += f"- 出生时间：{user.birth_time}\n"
    if user.birth_place:
        birth_context += f"- 出生地点：{user.birth_place}\n"

    # Build prompt
    system_prompt = """你是融合东西方智慧的资深塔罗解读师，也是一位善于从数据中发现规律的人生分析师。
你在为用户生成一周的塔罗日记综合复盘报告。

要求：
- 语言温暖自然，像一位老朋友在帮你回顾这一周
- 结论前置，开篇直接给出本周最核心的发现
- 分析牌面元素分布与情绪波动的关联
- 指出重复出现的主题或模式
- 若有出生星盘信息，结合星盘给出更有针对性的洞察
- 最后给出一句温暖有力的鼓励或行动建议
- 300-500字，Markdown 格式"""

    user_prompt = f"""## 本周日记概况
日期范围：{req.start_date} 至 {req.end_date}（共{total_entries}天）

## 每日记录
{chr(10).join(entry_summaries)}

## 牌面元素分布
{chr(10).join(element_lines)}

## 心情分布
{chr(10).join(mood_lines) if mood_lines else "（暂无心情记录）"}

## 用户星盘信息
{birth_context if birth_context else "（尚未填写出生信息）"}

请基于以上数据，生成一份本周塔罗日记综合复盘报告。"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

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
                        "max_tokens": 2000,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        if response.status_code == 401:
                            msg = "AI 服务认证失败，请检查 DEEPSEEK_API_KEY。"
                        elif response.status_code == 429:
                            msg = "AI 服务请求过于频繁，请稍后重试。"
                        else:
                            msg = f"AI 服务暂时不可用（{response.status_code}）"
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
                yield f"data: {json.dumps({'error': '周报生成超时，请稍后重试。'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'AI 服务连接失败：{str(e)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
