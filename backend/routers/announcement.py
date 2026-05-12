"""Admin announcement stored in Redis. Client reads from GET /api/announcement."""
import json
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routers.auth import get_current_user
from redis_utils import _redis_client

router = APIRouter(prefix="/api", tags=["announcement"])

ANNOUNCEMENT_KEY = "tarot:announcement"


class AnnouncementSet(BaseModel):
    text: str = ""
    expire_at: str = ""  # ISO datetime or empty


def _redis_get(key: str) -> str | None:
    try:
        if _redis_client:
            return _redis_client.get(key)
    except Exception:
        return None


def _redis_set(key: str, value: str):
    try:
        if _redis_client:
            _redis_client.set(key, value)
    except Exception:
        pass


def _redis_delete(key: str):
    try:
        if _redis_client:
            _redis_client.delete(key)
    except Exception:
        pass


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.get("/announcement")
def get_announcement():
    """Anyone can read the current announcement."""
    raw = _redis_get(ANNOUNCEMENT_KEY)
    if not raw:
        return {"text": "", "expire_at": None}
    try:
        return json.loads(raw)
    except Exception:
        return {"text": "", "expire_at": None}


@router.post("/admin/announcement")
def set_announcement(
    body: AnnouncementSet,
    admin: User = Depends(require_admin),
):
    """Admin sets or clears the announcement."""
    if not body.text.strip():
        _redis_delete(ANNOUNCEMENT_KEY)
        return {"ok": True, "message": "公告已清除"}

    data = {"text": body.text.strip(), "expire_at": body.expire_at or None}
    _redis_set(ANNOUNCEMENT_KEY, json.dumps(data, ensure_ascii=False))
    return {"ok": True, "message": "公告已发布"}
