import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, ReadingRecord
from routers.auth import get_current_user
from schemas import SaveReadingRequest, ReadingResponse

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.post("")
def save_reading(
    req: SaveReadingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = ReadingRecord(
        user_id=user.id,
        question=req.question,
        ai_response=req.ai_response,
        spread_type=req.spread_type,
        cards_json=json.dumps(req.cards, ensure_ascii=False),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "message": "保存成功"}


@router.get("", response_model=list[ReadingResponse])
def get_readings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    records = (
        db.query(ReadingRecord)
        .filter(ReadingRecord.user_id == user.id)
        .order_by(ReadingRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return records
