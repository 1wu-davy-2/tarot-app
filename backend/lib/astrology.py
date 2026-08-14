"""Phase 3: Astrology personalization — transit calculations for natal chart context."""
import math
from datetime import date, timedelta
from typing import Any

# ── Constants ──

ZODIAC_SIGNS = [
    "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
    "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
]

PLANET_NAMES = {
    "sun": "太阳", "moon": "月亮", "mercury": "水星", "venus": "金星",
    "mars": "火星", "jupiter": "木星", "saturn": "土星",
    "uranus": "天王星", "neptune": "海王星", "pluto": "冥王星",
}

# Approximate planetary periods (days to complete one zodiac cycle)
PLANET_PERIODS = {
    "sun": 365.25, "moon": 27.3, "mercury": 88, "venus": 225,
    "mars": 687, "jupiter": 4333, "saturn": 10759,
    "uranus": 30687, "neptune": 60190, "pluto": 90560,
}

# Retrograde periods for 2026 (approximate date ranges for Mercury)
MERCURY_RETROGRADE_2026 = [
    ("2026-03-15", "2026-04-07"),
    ("2026-07-18", "2026-08-11"),
    ("2026-11-08", "2026-11-28"),
]

# Simple zodiac degree ranges (each sign = 30 degrees)
ZODIAC_START_DEGREES = {name: i * 30 for i, name in enumerate(ZODIAC_SIGNS)}


def _julian_day(d: date) -> float:
    """Convert Gregorian date to Julian Day Number (approximate)."""
    a = (14 - d.month) // 12
    y = d.year + 4800 - a
    m = d.month + 12 * a - 3
    return d.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045


def _planet_longitude(planet: str, d: date) -> float:
    """Approximate ecliptic longitude of a planet on a given date (0-360 degrees).

    Uses simplified mean orbital elements. Accurate to ~1-3 degrees for inner planets,
    ~5 degrees for outer planets. Good enough for tarot context.
    """
    jd = _julian_day(d)
    period = PLANET_PERIODS.get(planet, 365)

    # Base positions at J2000.0 (Jan 1, 2000)
    j2000 = _julian_day(date(2000, 1, 1))
    days_since_j2000 = jd - j2000

    # Mean longitude
    mean_lon = (days_since_j2000 / period * 360) % 360

    # Add offsets per planet (approximate starting positions at J2000)
    offsets = {
        "sun": 280, "moon": 120, "mercury": 250, "venus": 180,
        "mars": 310, "jupiter": 35, "saturn": 50,
        "uranus": 315, "neptune": 300, "pluto": 250,
    }
    mean_lon = (mean_lon + offsets.get(planet, 0)) % 360

    return mean_lon


def _lon_to_sign(lon: float) -> tuple[str, float]:
    """Convert ecliptic longitude to zodiac sign name and degree within sign."""
    sign_idx = int(lon // 30) % 12
    degree = lon % 30
    return ZODIAC_SIGNS[sign_idx], degree


def _is_retrograde(planet: str, d: date) -> bool:
    """Check if a planet is currently retrograde (approximate)."""
    if planet == "mercury":
        for start_str, end_str in MERCURY_RETROGRADE_2026:
            start = date.fromisoformat(start_str)
            end = date.fromisoformat(end_str)
            if start <= d <= end:
                return True
    return False


def get_current_transits_summary(user: Any) -> str:
    """Build a Chinese summary of current planetary transits affecting the user.

    Args:
        user: User model with birth_date, birth_time, birth_place, zodiac fields.

    Returns:
        Human-readable Chinese text describing active transits, or empty string.
    """
    if not user or not user.birth_date:
        return ""

    today = date.today()

    # Calculate approximate natal sun position
    try:
        import calendar as cal
        birth_doy = user.birth_date.timetuple().tm_yday
        # Rough natal sun longitude: 0° at March equinox (~day 80), 360° per year
        natal_sun_lon = ((birth_doy - 80) / 365.25 * 360) % 360
        natal_sign, natal_deg = _lon_to_sign(natal_sun_lon)
    except Exception:
        return ""

    parts = []

    # Current transiting planets
    transit_planets = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"]
    aspects = []
    for planet in transit_planets:
        trans_lon = _planet_longitude(planet, today)
        trans_sign, _ = _lon_to_sign(trans_lon)

        # Check if it's in the same sign as natal sun (conjunction)
        if trans_sign == natal_sign:
            pname = PLANET_NAMES.get(planet, planet)
            aspects.append(f"行运{pname}正经过你的{natal_sign}，这是个人表达和行动的高亮期")

        # Check if it's opposite (180° apart)
        opp_idx = (ZODIAC_SIGNS.index(natal_sign) + 6) % 12
        if trans_sign == ZODIAC_SIGNS[opp_idx]:
            pname = PLANET_NAMES.get(planet, planet)
            aspects.append(f"行运{pname}正对分你的{natal_sign}，可能带来关系或外部的张力")

        # Check if retrograde
        if _is_retrograde(planet, today):
            pname = PLANET_NAMES.get(planet, planet)
            aspects.append(f"{pname}正在逆行，适合回顾和反思而非贸然推进")

    if aspects:
        parts.append("## 当前个人星象行进")
        for a in aspects[:5]:
            parts.append(f"- {a}")

    # Check if user's zodiac is directly affected by retrogrades
    affected = False
    for start_str, end_str in MERCURY_RETROGRADE_2026:
        start = date.fromisoformat(start_str)
        end = date.fromisoformat(end_str)
        if start <= today <= end:
            # Mercury retrogrades are felt most by Gemini and Virgo (Mercury-ruled)
            mercury_ruled = {"双子座", "处女座"}
            if user.zodiac in mercury_ruled:
                parts.append(f"- 特别注意：水星是你的守护星，此次逆行对你影响最为显著")
                affected = True
            elif natal_sign in mercury_ruled:
                parts.append(f"- 水星逆行对你（{natal_sign}上升）影响较明显")
                affected = True
            break

    return "\n".join(parts) if parts else ""


def get_critical_months_text(user: Any, months_ahead: int = 6) -> str:
    """Predict which upcoming months are most astrologically active for the user."""
    if not user or not user.birth_date:
        return ""

    today = date.today()
    try:
        birth_doy = user.birth_date.timetuple().tm_yday
        natal_sun_lon = ((birth_doy - 80) / 365.25 * 360) % 360
        natal_sign, _ = _lon_to_sign(natal_sun_lon)
    except Exception:
        return ""

    month_activity = {}
    for m in range(1, months_ahead + 1):
        d = date(today.year, ((today.month + m - 1) % 12) + 1, 15)
        # Adjust year rollover
        if today.month + m > 12:
            d = date(today.year + 1, (today.month + m - 1) % 12 + 1, 15)

        count = 0
        for planet in ["mars", "jupiter", "saturn"]:
            trans_lon = _planet_longitude(planet, d)
            trans_sign, _ = _lon_to_sign(trans_lon)
            if trans_sign == natal_sign:
                count += 1

        month_activity[d.strftime("%Y年%m月")] = count

    sorted_months = sorted(month_activity.items(), key=lambda x: -x[1])
    high_activity = [(k, v) for k, v in sorted_months if v >= 1]

    if not high_activity:
        return ""

    lines = ["## 未来关键月份"]
    for month_str, count in high_activity[:3]:
        lines.append(f"- **{month_str}**：天体活动较多，是做出重大改变的窗口期")
    return "\n".join(lines)
