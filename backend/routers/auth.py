import json

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import (
    RegisterRequest, LoginRequest, SendCodeRequest,
    VerifyEmailRequest, ResetPasswordRequest,
    TokenResponse, UserInfo, BirthChartUpdate,
)
from auth import hash_password, verify_password, create_access_token, decode_access_token
from email_utils import send_verification_email, generate_code
from redis_utils import save_code, verify_code
from datetime import date, time

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    token = authorization[7:]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="令牌无效或已过期")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def get_current_user_optional(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    return user


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    username = req.username.strip()
    email = req.email.strip().lower()
    phone = req.phone.strip()
    code = req.code.strip()

    # Step 1: Verify the code first (user must call /send-code before /register)
    if not verify_code(email, code, "register"):
        raise HTTPException(status_code=400, detail="验证码无效或已过期，请先获取验证码")

    # Step 2: Check duplicates
    existing_by_name = db.query(User).filter(User.username == username).first()
    existing_by_email = db.query(User).filter(User.email == email).first()
    print(f"[register] username='{username}' name_taken={existing_by_name is not None} email='{email}' email_taken={existing_by_email is not None}")

    if existing_by_name:
        raise HTTPException(status_code=400, detail="用户名已被注册")
    if existing_by_email:
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # Step 3: Create verified user
    # Early registrants (before 2026-06-30) get basic membership for 1 year
    from datetime import date, datetime, timedelta
    now = date.today()
    cutoff = date(2026, 6, 30)
    default_tier = "free"
    default_expiry = None
    if now <= cutoff:
        default_tier = "basic"
        default_expiry = datetime.utcnow() + timedelta(days=365)

    user = User(
        username=username,
        email=email,
        phone=phone,
        password_hash=hash_password(req.password),
        is_verified=True,
        zodiac=req.zodiac.strip() if req.zodiac and req.zodiac.strip() else None,
        membership_tier=default_tier,
        membership_expiry=default_expiry,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "注册成功，请登录", "user_id": user.id}


@router.post("/send-code")
def send_code(req: SendCodeRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    code_type = req.type

    if code_type == "register":
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="该邮箱已注册")
    elif code_type == "reset":
        if not db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="该邮箱未注册")
    else:
        raise HTTPException(status_code=400, detail="无效的验证码类型")

    code = generate_code()
    save_code(email, code, code_type)

    user = db.query(User).filter(User.email == email).first()
    name = user.username if user else ""
    send_verification_email(email, code, code_type, name)

    return {"message": "验证码已发送", "email": email}


@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    code = req.code.strip()

    if not verify_code(email, code, "register"):
        raise HTTPException(status_code=400, detail="验证码无效或已过期")

    user = db.query(User).filter(User.email == email).first()
    if user:
        user.is_verified = True
        db.commit()

    return {"message": "邮箱验证成功，请登录"}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    account = req.account.strip()

    user = (
        db.query(User)
        .filter((User.email == account.lower()) | (User.username == account))
        .first()
    )

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="账号或密码错误")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="请先验证邮箱后再登录")

    token = create_access_token(user.id, user.is_admin, long_lived=req.is_apk)

    return TokenResponse(
        access_token=token,
        username=user.username,
        email=user.email,
        zodiac=user.zodiac,
        is_admin=user.is_admin,
        membership_tier=user.membership_tier,
        membership_expiry=user.membership_expiry,
    )


@router.post("/forgot-password")
def forgot_password(req: SendCodeRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "如果该邮箱已注册，验证码已发送"}

    code = generate_code()
    save_code(email, code, "reset")
    send_verification_email(email, code, "reset", user.username)

    return {"message": "如果该邮箱已注册，验证码已发送"}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    code = req.code.strip()

    if not verify_code(email, code, "reset"):
        raise HTTPException(status_code=400, detail="验证码无效或已过期")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="用户不存在")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    return {"message": "密码重置成功，请登录"}


@router.get("/me", response_model=UserInfo)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserInfo)
def update_profile(
    req: BirthChartUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.birth_date is not None:
        if req.birth_date == "":
            user.birth_date = None
        else:
            user.birth_date = date.fromisoformat(req.birth_date)
    if req.birth_time is not None:
        if req.birth_time == "":
            user.birth_time = None
        else:
            parts = req.birth_time.split(":")
            user.birth_time = time(int(parts[0]), int(parts[1]))
    if req.birth_place is not None:
        user.birth_place = req.birth_place if req.birth_place != "" else None
    if req.zodiac is not None:
        user.zodiac = req.zodiac if req.zodiac != "" else None
    if req.mbti_type is not None:
        user.mbti_type = req.mbti_type if req.mbti_type != "" else None
    if req.sm_type is not None:
        user.sm_type = req.sm_type if req.sm_type != "" else None
    if req.sm_scores is not None:
        user.sm_scores = req.sm_scores if req.sm_scores != "" else None
    db.commit()
    db.refresh(user)
    return user


class AiModelUpdate(BaseModel):
    ai_model: str


@router.patch("/me/ai-model")
def set_ai_model(
    req: AiModelUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = ["deepseek", "openai", "claude", "gemini"]
    if req.ai_model not in allowed:
        raise HTTPException(status_code=400, detail=f"不支持的模型: {req.ai_model}")
    user.ai_model = req.ai_model
    db.commit()
    return {"ok": True, "ai_model": req.ai_model}


class LessonProgressUpdate(BaseModel):
    lesson_ids: list[str]


@router.get("/me/lessons")
def get_lesson_progress(user: User = Depends(get_current_user)):
    try:
        return {"lesson_ids": json.loads(user.lesson_progress or "[]")}
    except Exception:
        return {"lesson_ids": []}


@router.post("/me/lessons/save")
def save_lesson_progress(
    req: LessonProgressUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        current = set(json.loads(user.lesson_progress or "[]"))
    except Exception:
        current = set()
    for lid in req.lesson_ids:
        current.add(lid)
    user.lesson_progress = json.dumps(sorted(current))
    db.commit()
    return {"ok": True, "lesson_ids": sorted(current)}


@router.post("/me/ping")
def ping_activity(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update last_visit_at to track user activity for re-engagement."""
    from datetime import datetime as dt
    user.last_visit_at = dt.utcnow()
    db.commit()
    return {"ok": True}
