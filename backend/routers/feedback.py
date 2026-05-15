"""User feedback → stored in DB, batch-emailed on schedule."""
import smtplib
import threading
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from config import get_settings
from database import get_db, SessionLocal, engine
from models import User, Feedback
from routers.auth import get_current_user_optional

router = APIRouter(prefix="/api", tags=["feedback"])

AUTHOR_EMAIL = "wxk0246@163.com"


class FeedbackRequest(BaseModel):
    message: str
    username: str = ""
    email: str = ""
    phone: str = ""


def _send_email(subject: str, body_html: str) -> bool:
    settings = get_settings()
    if settings.email_mode == "console":
        print(f"\n{'='*50}")
        print(f"  FEEDBACK BATCH → {AUTHOR_EMAIL}")
        print(f"  {subject}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from
        msg["To"] = AUTHOR_EMAIL
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, AUTHOR_EMAIL, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[feedback] Email send failed: {e}")
        return False


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db), user: User | None = Depends(get_current_user_optional)):
    message = req.message.strip()
    if not message:
        return {"ok": False, "error": "内容不能为空"}
    if len(message) > 2000:
        return {"ok": False, "error": "内容过长（最多 2000 字）"}

    fb = Feedback(
        user_id=user.id if user else None,
        username=req.username or (user.username if user else ""),
        email=req.email or (user.email if user else ""),
        phone=req.phone or (user.phone if user else ""),
        message=message,
    )
    db.add(fb)
    db.commit()

    return {"ok": True}


# ── Scheduled batch sender ──

_scheduler_started = False


def _batch_send_loop():
    """Background thread: collect unsent feedbacks and email them on schedule.
    - 08:00-20:00: every 60 minutes
    - 21:00-07:59: once at 21:00 (if any unsent)
    """
    last_night_send_date = None  # track which night we already sent

    while True:
        now = datetime.now()
        hour = now.hour
        today = now.date()

        should_send = False
        if 8 <= hour < 20:
            should_send = True  # every 60 min in daytime
        elif hour >= 21 or hour < 8:
            # Night window: send once
            if last_night_send_date != today:
                should_send = True

        if should_send:
            db = SessionLocal()
            try:
                unsent = db.query(Feedback).filter(Feedback.sent == False).all()
                if unsent:
                    _send_feedback_batch(db, unsent)
                if hour >= 21 or hour < 8:
                    last_night_send_date = today
            except Exception as e:
                print(f"[feedback] Batch send error: {e}")
            finally:
                db.close()

        time.sleep(3600)  # check every 60 minutes


def _send_feedback_batch(db: Session, items: list[Feedback]):
    """Build a batch email from unsent feedbacks and mark them sent."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    rows = ""
    for fb in items:
        user_info = ""
        if fb.username:
            user_info += f"用户：{fb.username}"
        if fb.email:
            user_info += f" | 邮箱：{fb.email}"
        if fb.phone:
            user_info += f" | 手机：{fb.phone}"
        rows += f"""
    <div style="border:1px solid #2d1b69;border-radius:8px;padding:12px;margin:8px 0">
      <div style="color:#d4a853;font-size:12px;margin-bottom:6px">{user_info or '匿名用户'} · {fb.created_at}</div>
      <pre style="white-space:pre-wrap;font-family:inherit;line-height:1.8;margin:0;color:#e0d6ff">{fb.message}</pre>
    </div>"""

    html_body = f"""\
<div style="background:#0f0a1a;color:#e0d6ff;padding:24px;font-family:sans-serif;max-width:600px">
  <h2 style="color:#d4a853">命运之镜 · 用户反馈汇总</h2>
  <p style="color:#c084fc;font-size:13px">收集时间：{now_str} · 共 {len(items)} 条</p>
  <div style="border-top:1px solid #2d1b69;margin:16px 0"></div>
  {rows}
</div>"""

    subject = f"💬 命运之镜 · 用户反馈 ({len(items)}条)"
    if _send_email(subject, html_body):
        for fb in items:
            fb.sent = True
        db.commit()
        print(f"[feedback] Sent {len(items)} feedbacks to {AUTHOR_EMAIL}")


def start_feedback_scheduler():
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True
    t = threading.Thread(target=_batch_send_loop, daemon=True)
    t.start()
    print("[feedback] Scheduler started (60min daytime, once nightly)")
