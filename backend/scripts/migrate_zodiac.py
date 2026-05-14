"""Derive zodiac sign from birth_date for users who don't have it set.
Run once: python scripts/migrate_zodiac.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import SessionLocal
from models import User


def derive_zodiac(birth_date_str: str) -> str | None:
    """Derive zodiac from birth_date string (YYYY-MM-DD)."""
    try:
        parts = birth_date_str.split("-")
        if len(parts) < 2:
            return None
        month = int(parts[1])
        day = int(parts[2])
    except (ValueError, IndexError):
        return None

    ranges = [
        (3, 21, "白羊座"), (4, 20, "金牛座"), (5, 21, "双子座"), (6, 22, "巨蟹座"),
        (7, 23, "狮子座"), (8, 23, "处女座"), (9, 23, "天秤座"), (10, 24, "天蝎座"),
        (11, 23, "射手座"), (12, 22, "摩羯座"), (1, 20, "水瓶座"), (2, 19, "双鱼座"),
    ]

    for i, (m, d, name) in enumerate(ranges):
        next_m, next_d, _ = ranges[(i + 1) % len(ranges)]
        if month == m and day >= d:
            return name
        if month == next_m and day < next_d:
            return name
    return "摩羯座"


def main():
    db = SessionLocal()
    try:
        users = db.query(User).filter(
            User.birth_date.isnot(None),
            (User.zodiac.is_(None)) | (User.zodiac == "") | (User.zodiac == ""),
        ).all()

        updated = 0
        for user in users:
            zodiac = derive_zodiac(str(user.birth_date))
            if zodiac:
                user.zodiac = zodiac
                updated += 1
                print(f"  {user.username}: {user.birth_date} → {zodiac}")

        db.commit()
        print(f"\nUpdated {updated} users.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
