"""Re-engagement emails for inactive users (2-3 days since last visit).
Sends personalized daily tarot fortune with a link back to the site."""

import threading
import json
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User


SITE_URL = "http://www.lightpulse.fun"

# ── Email HTML Template ──

REENGAGE_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0a0612;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0612;padding:40px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#1a0f2e;border-radius:16px;border:1px solid rgba(212,168,83,0.25);overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="padding:32px 32px 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:36px;">🔮</p>
      <h1 style="margin:0 0 4px;font-size:22px;color:#d4a853;letter-spacing:4px;font-family:'Cinzel Decorative',Georgia,serif;">命运之镜</h1>
      <p style="margin:0;font-size:11px;color:rgba(192,132,252,0.5);letter-spacing:3px;">Mirror of Fate</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:0 32px;">
      <div style="border-top:1px solid rgba(212,168,83,0.12);"></div>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style="padding:24px 32px 8px;text-align:center;">
      <h2 style="margin:0;font-size:16px;color:#d4a853;letter-spacing:2px;font-family:'Cinzel Decorative',Georgia,serif;">✨ 命运的召唤 ✨</h2>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:16px 32px 24px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;color:rgba(232,224,240,0.8);line-height:1.8;">
        {greeting}，已经有 {days_away} 天没来命运之镜了——<br>
        命运不会等人，但总会在对的时候给你提示。
      </p>

      <!-- Daily card preview -->
      <div style="display:inline-block;padding:20px 28px;margin:12px 0 20px;background-color:rgba(45,27,105,0.4);border:1px solid rgba(212,168,83,0.2);border-radius:12px;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;color:rgba(212,168,83,0.5);letter-spacing:2px;">✦ 今日运势提示 ✦</p>
        <p style="margin:0;font-size:15px;color:#d4a853;line-height:1.8;font-style:italic;">
          {fortune_text}
        </p>
      </div>

      <p style="margin:0 0 24px;font-size:12px;color:rgba(232,224,240,0.4);line-height:1.8;">
        {extra_line}
      </p>
    </td>
  </tr>

  <!-- CTA Button -->
  <tr>
    <td style="padding:8px 32px 32px;text-align:center;">
      <a href="{site_url}" target="_blank" style="display:inline-block;padding:14px 44px;background:linear-gradient(135deg,rgba(192,132,252,0.3),rgba(45,27,105,0.8));border:1px solid rgba(212,168,83,0.4);border-radius:28px;color:#d4a853;font-size:15px;text-decoration:none;letter-spacing:2px;font-family:'Cinzel Decorative',Georgia,serif;">
        🔮 开启今日指引
      </a>
      <p style="margin:12px 0 0;font-size:10px;color:rgba(255,255,255,0.2);">
        或复制链接访问：{site_url}
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 32px;text-align:center;background-color:rgba(10,6,18,0.6);border-top:1px solid rgba(212,168,83,0.08);">
      <p style="margin:0 0 4px;font-size:10px;color:rgba(192,132,252,0.35);">
        命运之镜 · Mirror of Fate
      </p>
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.15);">
        不想收到此类邮件？登录后在个人设置中关闭提醒
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""

# ── Fortune teasers ──

FORTUNE_TEASERS = [
    "命运之轮正在转动，今天有一张牌在等你翻阅",
    "宇宙给你寄了一封信，就在今天的牌阵里",
    "今天的塔罗牌已经为你准备好了——来看看它在说什么",
    "有些事情不需要解释，一张牌就能让你豁然开朗",
    "星星在低语，月亮在指引——你今天的运势牌已经就位",
    "生活给你困惑，塔罗给你答案——今日牌面已备好",
    "每一张牌都是一面镜子，反射出你内心最真实的样子",
    "今天抽到的牌可能会改变你接下来一周的心情",
    "当你觉得自己被遗忘时，其实是命运在为你准备更大的惊喜",
    "塔罗从不说谎，它只是把你不敢面对的真相放在你面前",
    "你与命运的对话还差最后一步——翻开今天的牌",
    "昨晚的梦境可能是在暗示你——今天该抽一张牌了",
    "不必焦虑，宇宙自有安排——今天你的守护牌已经出现",
    "有些事情冥冥之中已有定数，但决定权依然在你手中",
    "我们之间隔着一张牌的距离——它已经等你很久了",
]

EXTRA_LINES = [
    "今天适合冥想、记录梦境，或者——翻开一张塔罗牌。",
    "哪怕只是看一眼今日运势，也是与命运的一次礼貌问候。",
    "当你准备好了，牌阵永远为你保留。",
    "今天的指引可能会让你想起某个被遗忘的决定。",
    "来听听命运今天想对你说什么——可能只是一句话，但刚好是你需要的。",
    "我们都在寻找某种指引，而牌阵是最诚实的导航。",
    "不要小看一张牌的暗示，它可能是你今天最重要的信号。",
    "每天抽一张牌，就像每天给灵魂做一次深呼吸。",
    "你不必相信命运，但你可以和它聊聊天。",
    "如果你在犹豫要不要点开——这就是命运在敲门了。",
]

GREETING_POOLS = [
    ["亲爱的 {name}", "嗨，{name}", "{name}，你好呀", "久违了，{name}"],
    ["好久不见", "有段日子没见了", "命运的指针又指向了你"],
]


def _build_email_html(username: str, days_away: int) -> str:
    greeting = random.choice(GREETING_POOLS[0]).format(name=username)
    if random.random() < 0.3:
        greeting = random.choice(GREETING_POOLS[1])
    fortune = random.choice(FORTUNE_TEASERS)
    extra = random.choice(EXTRA_LINES)

    return REENGAGE_HTML.format(
        greeting=greeting,
        days_away=days_away,
        fortune_text=fortune,
        extra_line=extra,
        site_url=SITE_URL,
    )


def _send_smtp(to_email: str, subject: str, html_body: str) -> bool:
    from config import get_settings
    settings = get_settings()

    if settings.email_mode == "console":
        try:
            print(f"\n{'='*50}")
            print(f"  RE-ENGAGE EMAIL TO: {to_email}")
            print(f"  SUBJECT: {subject}")
            print(f"{'='*50}\n")
        except UnicodeEncodeError:
            pass  # Windows GBK console can't print emoji
        return True

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.header import Header
        import re

        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header(subject, "utf-8")
        from_addr = settings.smtp_from if settings.smtp_from and "@" in settings.smtp_from else settings.smtp_user
        msg["From"] = from_addr
        msg["To"] = to_email

        plain = re.sub(r"<[^>]+>", "", html_body)
        msg.attach(MIMEText(plain, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
            server.starttls()

        with server:
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(from_addr, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[reengage] SMTP error: {e}")
        return False


def send_reengage_email(username: str, email: str, days_away: int) -> bool:
    """Send a re-engagement email to one user."""
    html = _build_email_html(username, days_away)
    subject = f"🔮 命运在召唤 · 你已经 {days_away} 天没来抽牌了"
    return _send_smtp(email, subject, html)


# ── Scheduler ──

_scheduler_started = False


def _reengage_loop():
    """Background loop: runs daily at 10:00 AM, checks for inactive users."""
    import time
    while True:
        now = datetime.now()
        # Next run at 10:00 today or tomorrow
        next_run = now.replace(hour=10, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)
        sleep_sec = (next_run - now).total_seconds()
        print(f"[reengage] Next run at {next_run.strftime('%Y-%m-%d %H:%M:%S')} (sleep {int(sleep_sec)}s)")
        time.sleep(sleep_sec)

        try:
            _run_reengage()
        except Exception as e:
            print(f"[reengage] Error: {e}")


def _run_reengage():
    """Find inactive users (2-3 days since last visit) and send re-engagement emails."""
    db = SessionLocal()
    try:
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        two_days_ago = datetime.utcnow() - timedelta(days=2)

        # Users whose last_visit_at is 2-3 days ago (never visited = NULL = skip for now)
        users = db.query(User).filter(
            User.email != "",
            User.email.isnot(None),
            User.is_verified == True,
            User.last_visit_at >= three_days_ago,
            User.last_visit_at < two_days_ago,
        ).all()

        print(f"[reengage] Found {len(users)} inactive users (2-3 days)")

        sent = 0
        for user in users:
            days_away = (datetime.utcnow() - user.last_visit_at).days
            if days_away < 2 or days_away > 3:
                continue
            if send_reengage_email(user.username, user.email, days_away):
                sent += 1
                print(f"[reengage] Sent to {user.email} (away {days_away}d)")

        print(f"[reengage] Sent {sent} re-engagement emails")
    finally:
        db.close()


def start_reengage_scheduler():
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True
    t = threading.Thread(target=_reengage_loop, daemon=True)
    t.start()
    print("[reengage] Scheduler started (daily at 10:00)")
