from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime, date, time
import re


# ── Auth ──

class RegisterRequest(BaseModel):
    username: str
    email: str
    phone: str
    password: str
    code: str  # 验证码（必须先调用 /send-code 获取）
    zodiac: Optional[str] = None  # 星座，选填

    @validator("username")
    def username_valid(cls, v):
        v = v.strip()
        if len(v) < 2 or len(v) > 50:
            raise ValueError("用户名长度2-50位")
        return v

    @validator("email")
    def email_valid(cls, v):
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v

    @validator("phone")
    def phone_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("手机号为必填项")
        if not re.match(r"^1[3-9]\d{9}$", v):
            raise ValueError("手机号格式不正确（11位中国大陆手机号）")
        return v

    @validator("password")
    def password_valid(cls, v):
        if len(v) < 6:
            raise ValueError("密码长度至少6位")
        return v

    @validator("code")
    def code_valid(cls, v):
        v = v.strip()
        if len(v) != 6 or not v.isdigit():
            raise ValueError("验证码为6位数字")
        return v


class LoginRequest(BaseModel):
    account: str  # email or username
    password: str


class SendCodeRequest(BaseModel):
    email: str
    type: str = "register"  # "register" | "reset"


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

    @validator("new_password")
    def password_valid(cls, v):
        if len(v) < 6:
            raise ValueError("密码长度至少6位")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str
    zodiac: Optional[str] = None
    is_admin: bool
    membership_tier: Optional[str] = "free"
    membership_expiry: Optional[datetime] = None


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    zodiac: Optional[str] = None
    is_verified: bool
    is_admin: bool
    membership_tier: Optional[str] = "free"
    membership_expiry: Optional[datetime] = None
    ai_model: Optional[str] = "deepseek"
    created_at: datetime
    birth_date: Optional[date] = None
    birth_time: Optional[str] = None    # serialized as "HH:MM"
    birth_place: Optional[str] = None
    birth_lat: Optional[float] = None
    mbti_type: Optional[str] = None
    sm_type: Optional[str] = None
    sm_scores: Optional[str] = None
    birth_lng: Optional[float] = None

    class Config:
        from_attributes = True

    @validator("birth_time", pre=True)
    def format_birth_time(cls, v):
        """Serialize time object to 'HH:MM' string."""
        if v is None:
            return None
        if isinstance(v, time):
            return v.strftime("%H:%M")
        return v


# ── Quota ──

class QuotaResponse(BaseModel):
    date: str
    base_quota: int
    bonus_quota: int
    gifted_quota: int
    used_count: int
    remaining: int


class CheckInResponse(BaseModel):
    date: str
    bonus_awarded: int
    already_checked_in: bool


# ── Readings ──

class SaveReadingRequest(BaseModel):
    question: str = ""
    ai_response: str = ""
    spread_type: str = ""
    cards: list = []


class ReadingResponse(BaseModel):
    id: int
    question: str
    ai_response: str
    spread_type: str
    cards_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Journal ──

class JournalCreate(BaseModel):
    date: str          # YYYY-MM-DD
    card_id: int
    is_reversed: bool = False
    mood: Optional[int] = None   # 1-5
    note: Optional[str] = None

    @validator("date")
    def date_valid(cls, v):
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("日期格式必须为 YYYY-MM-DD")
        return v

    @validator("mood")
    def mood_valid(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("心情值必须在1-5之间")
        return v

    @validator("note")
    def note_valid(cls, v):
        if v and len(v) > 200:
            raise ValueError("笔记最多200字")
        return v


class JournalResponse(BaseModel):
    id: int
    date: str
    card_id: int
    is_reversed: bool
    mood: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MonthJournalResponse(BaseModel):
    entries: list[JournalResponse] = []


# ── Birth Chart / Profile Update ──

class BirthChartUpdate(BaseModel):
    birth_date: Optional[str] = None     # "YYYY-MM-DD", None = no change
    birth_time: Optional[str] = None     # "HH:MM", None = no change
    birth_place: Optional[str] = None    # city name, None = no change
    zodiac: Optional[str] = None         # existing zodiac field
    mbti_type: Optional[str] = None      # e.g. "INFP|调停者|#d4a853"
    sm_type: Optional[str] = None        # e.g. "Dominant|支配者"
    sm_scores: Optional[str] = None      # JSON [{type,score}]

    @validator("birth_date")
    def bd_valid(cls, v):
        if v is not None and v != "" and not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("生日格式必须为 YYYY-MM-DD")
        return v

    @validator("birth_time")
    def bt_valid(cls, v):
        if v is not None and v != "" and not re.match(r"^\d{2}:\d{2}(:\d{2})?$", v):
            raise ValueError("时间格式必须为 HH:MM")
        return v


# ── Weekly Report ──

class WeeklyReportRequest(BaseModel):
    start_date: str   # "YYYY-MM-DD"
    end_date: str     # "YYYY-MM-DD"

    @validator("start_date", "end_date")
    def date_valid(cls, v):
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("日期格式必须为 YYYY-MM-DD")
        return v
