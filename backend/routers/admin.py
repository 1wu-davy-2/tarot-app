"""Admin-only endpoints."""
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import User, ReadingRecord
from routers.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.get("/readings")
def admin_readings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get all readings across all users, newest first."""
    records = (
        db.query(ReadingRecord)
        .order_by(ReadingRecord.created_at.desc())
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
):
    """List all users with basic info."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "phone": u.phone,
        "is_verified": u.is_verified,
        "is_admin": u.is_admin,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]
