import random
import string
from config import get_settings

settings = get_settings()

# In-memory store for dev mode (email -> latest code)
_dev_codes: dict[str, str] = {}


def generate_code() -> str:
    return "".join(random.choices(string.digits, k=6))


# ── HTML Email Templates ──

def _email_wrapper(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0a0612;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0612;padding:40px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#1a0f2e;border-radius:16px;border:1px solid rgba(212,168,83,0.25);overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="padding:32px 32px 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:28px;color:#d4a853;">✧</p>
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

  <!-- Title -->
  <tr>
    <td style="padding:24px 32px 8px;text-align:center;">
      <h2 style="margin:0;font-size:16px;color:#d4a853;letter-spacing:2px;font-family:'Cinzel Decorative',Georgia,serif;">{title}</h2>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:16px 32px 32px;text-align:center;">
      {body}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 32px;text-align:center;background-color:rgba(10,6,18,0.6);border-top:1px solid rgba(212,168,83,0.08);">
      <p style="margin:0 0 4px;font-size:10px;color:rgba(192,132,252,0.35);">
        {settings.smtp_from_name}
      </p>
      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.15);">
        此邮件由系统自动发送，请勿回复
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _verification_code_html(name: str, code: str, purpose: str) -> str:
    greeting = f"你好，{name}" if name else "你好"
    return f"""
      <p style="margin:0 0 12px;font-size:14px;color:rgba(232,224,240,0.8);line-height:1.8;">
        {greeting}，欢迎使用命运之镜塔罗！
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:rgba(232,224,240,0.6);line-height:1.8;">
        {purpose}，请在 5 分钟内输入以下验证码完成验证：
      </p>

      <!-- Code box -->
      <div style="display:inline-block;padding:20px 40px;margin:8px 0 24px;background-color:rgba(45,27,105,0.5);border:2px solid rgba(212,168,83,0.3);border-radius:12px;">
        <span style="font-size:32px;color:#d4a853;letter-spacing:12px;font-family:'Courier New',monospace;font-weight:bold;">{code}</span>
      </div>

      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;">
        验证码 5 分钟内有效。<br>
        如非本人操作，请忽略此邮件。
      </p>"""


def _reset_password_html(name: str, code: str) -> str:
    greeting = f"你好，{name}" if name else "你好"
    return f"""
      <p style="margin:0 0 12px;font-size:14px;color:rgba(232,224,240,0.8);line-height:1.8;">
        {greeting}，我们收到了你的密码重置请求。
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:rgba(232,224,240,0.6);line-height:1.8;">
        请使用以下验证码完成密码重置（5 分钟内有效）：
      </p>

      <div style="display:inline-block;padding:20px 40px;margin:8px 0 24px;background-color:rgba(45,27,105,0.5);border:2px solid rgba(212,168,83,0.3);border-radius:12px;">
        <span style="font-size:32px;color:#d4a853;letter-spacing:12px;font-family:'Courier New',monospace;font-weight:bold;">{code}</span>
      </div>

      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;">
        如非本人操作，请忽略此邮件，你的账户是安全的。
      </p>"""


# ── Send Email ──

def send_verification_email(email: str, code: str, code_type: str = "register", name: str = "") -> bool:
    """Send a styled HTML verification email. Falls back to console in dev mode."""

    if settings.email_mode == "console":
        _dev_codes[email] = code
        print(f"\n{'='*50}")
        print(f"  EMAIL TO: {email}")
        print(f"  TYPE:     {code_type}")
        print(f"  CODE:     {code}")
        print(f"{'='*50}\n")
        return True

    # Build HTML
    if code_type == "reset":
        title = "🔐 密码重置"
        body = _reset_password_html(name, code)
    else:
        title = "🔮 邮箱验证"
        purpose = "你正在进行邮箱验证" if code_type == "register" else "你正在进行身份验证"
        body = _verification_code_html(name, code, purpose)

    html = _email_wrapper(title, body)
    subject = f"{"🔮" if code_type == "register" else "🔐"} 命运之镜 - {"邮箱验证码" if code_type == "register" else "密码重置验证码"}"

    return _send_smtp(email, subject, html)


def _send_smtp(to_email: str, subject: str, html_body: str) -> bool:
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.utils import formataddr

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        from_addr = settings.smtp_from if settings.smtp_from and "@" in settings.smtp_from else settings.smtp_user
        msg["From"] = formataddr((settings.smtp_from_name, from_addr))
        msg["To"] = to_email

        # Plain text fallback
        import re
        plain = re.sub(r"<[^>]+>", "", html_body)
        msg.attach(MIMEText(plain, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Port 465 = implicit SSL, port 587 = STARTTLS
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
        print(f"SMTP error: {e}")
        return False


def get_dev_code(email: str) -> str | None:
    return _dev_codes.get(email)
