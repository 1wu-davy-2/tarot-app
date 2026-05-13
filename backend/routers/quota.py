from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, DailyQuota
from routers.auth import get_current_user
from routers.checkin import get_today, get_or_create_quota
from config import get_settings

router = APIRouter(prefix="/api/quota", tags=["quota"])
settings = get_settings()


@router.get("")
def get_quota(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_admin:
        return {
            "date": get_today(),
            "base_quota": settings.admin_quota,
            "bonus_quota": 0,
            "gifted_quota": 0,
            "used_count": 0,
            "remaining": settings.admin_quota,
        }

    quota = get_or_create_quota(user.id, db)
    return {
        "date": quota.date,
        "base_quota": quota.base_quota,
        "bonus_quota": quota.bonus_quota,
        "gifted_quota": quota.gifted_quota or 0,
        "used_count": quota.used_count,
        "remaining": max(0, quota.base_quota + quota.bonus_quota + (quota.gifted_quota or 0) - quota.used_count),
    }


@router.post("/consume")
def consume_quota(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_admin:
        return {"success": True, "remaining": settings.admin_quota}

    quota = get_or_create_quota(user.id, db)
    remaining = quota.base_quota + quota.bonus_quota + (quota.gifted_quota or 0) - quota.used_count

    if remaining <= 0:
        raise HTTPException(status_code=429, detail="今日AI解读次数已用完，请签到获取更多或明天再来")

    quota.used_count += 1
    db.commit()

    new_remaining = quota.base_quota + quota.bonus_quota + (quota.gifted_quota or 0) - quota.used_count
    return {"success": True, "remaining": max(0, new_remaining)}
