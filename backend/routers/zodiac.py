"""Daily horoscope powered by DeepSeek, cached in Redis for 24h."""
import json
import time
import random

import httpx
from fastapi import APIRouter

from config import get_settings
from redis_utils import _redis_client

router = APIRouter(prefix="/api", tags=["zodiac"])

ZODIAC_LIST = [
    "白羊座", "金牛座", "双子座", "巨蟹座",
    "狮子座", "处女座", "天秤座", "天蝎座",
    "射手座", "摩羯座", "水瓶座", "双鱼座",
]

HOROSCOPE_PROMPT = """你是星座运势专家。为{sign}生成今日运势。
日期：{date}
格式要求（纯文本，100-150字，口语化）：
1. 整体运势一句话（像朋友聊天）
2. 感情运一句话
3. 工作运一句话
4. 幸运数字（1-99随机）
5. 幸运颜色

不要用"##"标题，直接给出5行内容。"""


def _get_cache_key(sign: str, today: str) -> str:
    return f"tarot:horoscope:{sign}:{today}"


def _try_redis_set(key: str, value: str, ttl: int = 86400):
    try:
        if _redis_client:
            _redis_client.setex(key, ttl, value)
    except Exception:
        pass


def _try_redis_get(key: str) -> str | None:
    try:
        if _redis_client:
            return _redis_client.get(key)
    except Exception:
        return None


@router.get("/zodiac/list")
def zodiac_list():
    return {"signs": ZODIAC_LIST}


@router.get("/horoscope")
async def horoscope(sign: str = ""):
    if sign not in ZODIAC_LIST:
        return {"error": "无效的星座"}

    settings = get_settings()
    today = time.strftime("%Y-%m-%d")

    # Check cache
    cache_key = _get_cache_key(sign, today)
    cached = _try_redis_get(cache_key)
    if cached:
        return json.loads(cached)

    api_key = settings.deepseek_api_key
    if not api_key:
        return {"sign": sign, "date": today, "text": f"AI 服务未配置", "cached": False}

    prompt = HOROSCOPE_PROMPT.format(sign=sign, date=today)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "model": "deepseek-v4-pro",
                    "messages": [
                        {"role": "system", "content": "你是星座运势专家，回复简洁口语化。"},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.9,
                    "max_tokens": 300,
                    "stream": False,
                },
            )
            data = res.json()
            text = data["choices"][0]["message"]["content"]
    except Exception:
        text = "今日星辰隐匿，运势静待揭晓。请稍后再试。"

    result = {"sign": sign, "date": today, "text": text.strip(), "cached": False}
    _try_redis_set(cache_key, json.dumps(result, ensure_ascii=False))

    return result
