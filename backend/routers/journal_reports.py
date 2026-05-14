from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, ReportRecord
from routers.auth import get_current_user

router = APIRouter(prefix="/api/journal", tags=["journal-reports"])

REPORT_LIMITS = {"free": 3, "basic": 8, "premium": 15}


class SaveReportRequest(BaseModel):
    type: str
    title: str = ""
    period: str = ""
    content_html: str = ""


@router.post("/reports")
def save_report(
    req: SaveReportRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.type not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="type must be weekly or monthly")

    tier = (user.membership_tier or "free").lower()
    limit = REPORT_LIMITS.get(tier, 3)

    report = ReportRecord(
        user_id=user.id,
        type=req.type,
        title=req.title,
        period=req.period,
        content_html=req.content_html,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    existing = (
        db.query(ReportRecord)
        .filter(ReportRecord.user_id == user.id, ReportRecord.type == req.type)
        .order_by(ReportRecord.created_at.desc())
        .offset(limit)
        .all()
    )
    for r in existing:
        db.delete(r)
    db.commit()

    return {"ok": True, "id": report.id, "pruned": len(existing)}


@router.get("/reports")
def list_reports(
    type: str = Query("weekly"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if type not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="type must be weekly or monthly")

    tier = (user.membership_tier or "free").lower()
    limit = REPORT_LIMITS.get(tier, 3)

    reports = (
        db.query(ReportRecord)
        .filter(ReportRecord.user_id == user.id, ReportRecord.type == type)
        .order_by(ReportRecord.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "reports": [
            {
                "id": r.id,
                "type": r.type,
                "title": r.title,
                "period": r.period,
                "content_html": r.content_html,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ],
        "limit": limit,
    }


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(ReportRecord).filter(
        ReportRecord.id == report_id,
        ReportRecord.user_id == user.id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(report)
    db.commit()
    return {"ok": True}
