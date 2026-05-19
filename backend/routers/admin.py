"""Admin-only endpoints."""
import json
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from models import User, ReadingRecord, DailyQuota
from routers.auth import get_current_user
from routers.checkin import get_today, get_or_create_quota
from config import get_settings

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.get("/stats")
def admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Dashboard stats: totals, today's activity."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_readings = db.query(func.count(ReadingRecord.id)).scalar() or 0
    today_str = date.today().isoformat()
    today_readings = db.query(func.count(ReadingRecord.id)).filter(
        ReadingRecord.created_at >= today_str
    ).scalar() or 0
    week_ago = datetime.now() - timedelta(days=7)
    week_readings = db.query(func.count(ReadingRecord.id)).filter(
        ReadingRecord.created_at >= week_ago
    ).scalar() or 0
    premium_users = db.query(func.count(User.id)).filter(
        User.membership_tier.in_(["basic", "premium"])
    ).scalar() or 0

    # Top spread types
    spread_rows = db.query(
        ReadingRecord.spread_type, func.count(ReadingRecord.id).label("cnt")
    ).group_by(ReadingRecord.spread_type).order_by(func.count(ReadingRecord.id).desc()).limit(6).all()

    return {
        "total_users": total_users,
        "total_readings": total_readings,
        "today_readings": today_readings,
        "week_readings": week_readings,
        "premium_users": premium_users,
        "top_spreads": [{"name": r[0], "count": r[1]} for r in spread_rows],
    }


@router.delete("/readings/{reading_id}")
def delete_reading(
    reading_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    r = db.query(ReadingRecord).filter(ReadingRecord.id == reading_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(r)
    db.commit()
    return {"ok": True, "message": "已删除"}


@router.get("/readings")
def admin_readings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=100),
):
    """Get all readings across all users, newest first. Optional search by username or question."""
    q = db.query(ReadingRecord)
    if search:
        # Join users to search by username
        q = q.join(User, ReadingRecord.user_id == User.id).filter(
            (User.username.contains(search)) |
            (ReadingRecord.question.contains(search)) |
            (ReadingRecord.spread_type.contains(search))
        )
    records = (
        q.order_by(ReadingRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Collect all user IDs to batch-fetch usernames
    user_ids = list({r.user_id for r in records})
    users = {
        u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}

    result = []
    for r in records:
        u = users.get(r.user_id)
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "username": u.username if u else "unknown",
            "email": u.email if u else "",
            "question": r.question,
            "ai_response": r.ai_response,
            "spread_type": r.spread_type,
            "cards": json.loads(r.cards_json or "[]"),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return result


@router.get("/users")
def admin_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str = Query("", max_length=100),
):
    """List all users with basic info. Optional search by username or email."""
    q = db.query(User)
    if search:
        q = q.filter(
            (User.username.contains(search)) |
            (User.email.contains(search))
        )
    users = q.order_by(User.created_at.desc()).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "phone": u.phone,
        "is_verified": u.is_verified,
        "is_admin": u.is_admin,
        "membership_tier": u.membership_tier or "free",
        "membership_expiry": u.membership_expiry.isoformat() if u.membership_expiry else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]


class GiftQuotaBody(BaseModel):
    user_id: int
    amount: int


@router.post("/gift-quota")
def gift_quota(
    body: GiftQuotaBody,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin gifts AI quota to a specific user for today."""
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="赠送次数必须大于0")

    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    quota = get_or_create_quota(body.user_id, db)
    quota.gifted_quota = (quota.gifted_quota or 0) + body.amount
    db.commit()

    remaining = quota.base_quota + quota.bonus_quota + quota.gifted_quota - quota.used_count
    return {
        "ok": True,
        "message": f"已赠送 {body.amount} 次给 {user.username}",
        "user_id": body.user_id,
        "username": user.username,
        "gifted_quota": quota.gifted_quota,
        "remaining": max(0, remaining),
    }


class SetMembershipBody(BaseModel):
    user_id: int
    tier: str  # "free", "basic", "premium"
    expiry_date: str | None = None  # "YYYY-MM-DD"


@router.post("/set-membership")
def set_membership(
    body: SetMembershipBody,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin sets membership tier and optional expiry for a user."""
    if body.tier not in ("free", "basic", "premium"):
        raise HTTPException(status_code=400, detail="无效的会员等级，可选: free, basic, premium")

    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.membership_tier = body.tier
    if body.expiry_date:
        try:
            user.membership_expiry = datetime.strptime(body.expiry_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式应为 YYYY-MM-DD")
    else:
        user.membership_expiry = None

    db.commit()

    # If membership changed, refresh today's quota base
    if body.tier != "free":
        settings = get_settings()
        new_base = settings.member_premium_quota if body.tier == "premium" else settings.member_basic_quota
        quota = get_or_create_quota(body.user_id, db)
        quota.base_quota = new_base
        db.commit()

    return {
        "ok": True,
        "message": f"已设置 {user.username} 为 {body.tier} 会员",
        "user_id": body.user_id,
        "membership_tier": body.tier,
        "membership_expiry": body.expiry_date,
    }
