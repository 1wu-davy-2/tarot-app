from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re


# ── Auth ──

class RegisterRequest(BaseModel):
    username: str
    email: str
    phone: str
    password: str
    code: str  # 验证码（必须先调用 /send-code 获取）

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
    is_admin: bool


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    is_verified: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Quota ──

class QuotaResponse(BaseModel):
    date: str
    base_quota: int
    bonus_quota: int
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
