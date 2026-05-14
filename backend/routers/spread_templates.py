"""Anonymous community spread templates — no user tracking."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from datetime import datetime
import json
import re

from database import get_db
from models import SpreadTemplate

router = APIRouter(prefix="/api/spread-templates", tags=["spread-templates"])


class SpreadTemplateCreate(BaseModel):
    name: str
    description: str = ""
    card_count: int
    layout_json: str  # JSON string: { type, nodes, positions }
    icon: str = "✨"

    @validator("name")
    def name_valid(cls, v):
        v = v.strip()
        if len(v) < 1 or len(v) > 30:
            raise ValueError("牌阵名称 1-30 字符")
        return v

    @validator("card_count")
    def count_valid(cls, v):
        if v < 1 or v > 15:
            raise ValueError("牌数量 1-15")
        return v

    @validator("description")
    def desc_valid(cls, v):
        if len(v) > 200:
            raise ValueError("描述最多 200 字符")
        return v


class SpreadTemplateResponse(BaseModel):
    id: int
    name: str
    description: str
    card_count: int
    layout_json: str
    icon: str
    use_count: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("")
def upload_template(
    body: SpreadTemplateCreate,
    db: Session = Depends(get_db),
):
    # Validate JSON
    try:
        parsed = json.loads(body.layout_json)
        if not isinstance(parsed, dict):
            raise ValueError("layout_json 必须是 JSON 对象")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"layout_json 格式错误: {str(e)}")

    template = SpreadTemplate(
        name=body.name,
        description=body.description,
        card_count=body.card_count,
        layout_json=body.layout_json,
        icon=body.icon,
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return {"ok": True, "id": template.id, "name": template.name}


@router.get("")
def list_templates(
    sort: str = Query("popular", regex="^(popular|newest)$"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(SpreadTemplate)
    if sort == "popular":
        q = q.order_by(SpreadTemplate.use_count.desc())
    else:
        q = q.order_by(SpreadTemplate.created_at.desc())

    templates = q.limit(limit).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "card_count": t.card_count,
            "layout_json": t.layout_json,
            "icon": t.icon,
            "use_count": t.use_count,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in templates
    ]


@router.post("/{template_id}/use")
def use_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(SpreadTemplate).filter(SpreadTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    template.use_count = (template.use_count or 0) + 1
    db.commit()

    return {"ok": True, "use_count": template.use_count}
