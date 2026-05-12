"""User feedback / feature request → email to author."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Request
from pydantic import BaseModel

from config import get_settings

router = APIRouter(prefix="/api", tags=["feedback"])

AUTHOR_EMAIL = "wxk0246@163.com"


class FeedbackRequest(BaseModel):
    message: str  # max 2000 chars ideally


def _strip_html(text: str) -> str:
    import re
    return re.sub(r"<[^>]*>", "", text)


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Send user feedback to the author's email."""
    settings = get_settings()
    message = req.message.strip()

    if not message:
        return {"ok": False, "error": "内容不能为空"}

    if len(message) > 2000:
        return {"ok": False, "error": "内容过长（最多 2000 字）"}

    if settings.email_mode == "console":
        print(f"\n{'='*50}")
        print(f"  FEEDBACK → {AUTHOR_EMAIL}")
        print(f"  {message}")
        print(f"{'='*50}\n")
        return {"ok": True}

    # Build a simple HTML email
    html_body = f"""\
<div style="background:#0f0a1a;color:#e0d6ff;padding:24px;font-family:sans-serif;max-width:600px">
  <h2 style="color:#d4a853">命运之镜 · 用户反馈</h2>
  <div style="border-top:1px solid #2d1b69;margin:16px 0"></div>
  <pre style="white-space:pre-wrap;font-family:inherit;line-height:1.8;margin:0">{message}</pre>
</div>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "\U0001F4AC 命运之镜 · 用户反馈"
    msg["From"] = settings.smtp_from
    msg["To"] = AUTHOR_EMAIL
    msg.attach(MIMEText(message, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, AUTHOR_EMAIL, msg.as_string())
        server.quit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": f"邮件发送失败：{e}"}
