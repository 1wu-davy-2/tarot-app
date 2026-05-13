from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, DailyJournal
from schemas import JournalCreate, JournalResponse, MonthJournalResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalResponse)
def save_journal_entry(
    req: JournalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(DailyJournal).filter(
        DailyJournal.user_id == user.id,
        DailyJournal.date == req.date,
    ).first()

    if existing:
        existing.card_id = req.card_id
        existing.is_reversed = req.is_reversed
        existing.mood = req.mood
        existing.note = req.note
        db.commit()
        db.refresh(existing)
        return existing

    entry = DailyJournal(
        user_id=user.id,
        date=req.date,
        card_id=req.card_id,
        is_reversed=req.is_reversed,
        mood=req.mood,
        note=req.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("")
def get_journal(
    date: str = Query(None),
    month: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(DailyJournal).filter(DailyJournal.user_id == user.id)

    if date:
        entry = query.filter(DailyJournal.date == date).first()
        return entry
    if month:
        entries = (
            query.filter(DailyJournal.date.like(f"{month}%"))
            .order_by(DailyJournal.date.asc())
            .all()
        )
        return {"entries": entries}

    raise HTTPException(status_code=400, detail="请提供 date 或 month 查询参数")


@router.delete("/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(DailyJournal).filter(
        DailyJournal.id == entry_id,
        DailyJournal.user_id == user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="日记记录不存在")
    db.delete(entry)
    db.commit()
    return {"message": "已删除"}
