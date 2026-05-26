import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, CheckIn, DailyQuota
from routers.auth import get_current_user
from config import get_settings

router = APIRouter(prefix="/api", tags=["checkin"])
settings = get_settings()


def get_today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def get_or_create_quota(user_id: int, db: Session) -> DailyQuota:
    today = get_today()
    quota = db.query(DailyQuota).filter(
        DailyQuota.user_id == user_id,
        DailyQuota.date == today,
    ).first()
    if not quota:
        # Determine base quota based on membership
        user = db.query(User).filter(User.id == user_id).first()
        base_quota = settings.daily_base_quota
        if user and user.membership_tier and user.membership_tier != "free":
            if user.membership_expiry and user.membership_expiry < datetime.utcnow():
                pass  # Membership expired, use default
            elif user.membership_tier == "premium":
                base_quota = settings.member_premium_quota
            elif user.membership_tier == "basic":
                base_quota = settings.member_basic_quota

        quota = DailyQuota(
            user_id=user_id,
            date=today,
            base_quota=base_quota,
            bonus_quota=0,
            gifted_quota=0,
            used_count=0,
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota


@router.post("/checkin")
def checkin(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = get_today()

    # Use SELECT ... FOR UPDATE to prevent race condition
    existing = db.query(CheckIn).filter(
        CheckIn.user_id == user.id,
        CheckIn.date == today,
    ).with_for_update().first()

    if existing:
        return {"date": today, "bonus_awarded": 0, "already_checked_in": True, "message": "今日已签到"}

    # Award random bonus
    bonus = random.randint(settings.checkin_min_bonus, settings.checkin_max_bonus)

    # Create checkin record
    checkin = CheckIn(user_id=user.id, date=today, bonus_awarded=bonus)
    db.add(checkin)

    # Update today's quota
    quota = get_or_create_quota(user.id, db)
    quota.bonus_quota += bonus
    db.commit()

    return {
        "date": today,
        "bonus_awarded": bonus,
        "already_checked_in": False,
        "message": f"签到成功！获得 {bonus} 次AI解读机会",
    }
