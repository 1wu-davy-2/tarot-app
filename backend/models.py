from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, Time, Float
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(20), default="")
    zodiac = Column(String(20), nullable=True, default=None)
    birth_date = Column(Date, nullable=True)
    birth_time = Column(Time, nullable=True)
    birth_place = Column(String(100), nullable=True)
    birth_lat = Column(Float, nullable=True)
    birth_lng = Column(Float, nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    membership_tier = Column(String(20), default="free")
    membership_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DailyQuota(Base):
    __tablename__ = "daily_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    base_quota = Column(Integer, default=2)
    bonus_quota = Column(Integer, default=0)
    gifted_quota = Column(Integer, default=0)
    used_count = Column(Integer, default=0)


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    bonus_awarded = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReadingRecord(Base):
    __tablename__ = "reading_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question = Column(Text, default="")
    ai_response = Column(Text, default="")
    spread_type = Column(String(50), default="")
    cards_json = Column(Text, default="[]")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DailyJournal(Base):
    __tablename__ = "daily_journal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # "YYYY-MM-DD"
    card_id = Column(Integer, nullable=False)
    is_reversed = Column(Boolean, default=False)
    mood = Column(Integer, nullable=True)   # 1-5 or null
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpreadTemplate(Base):
    __tablename__ = "spread_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(30), nullable=False)
    description = Column(String(200), default="")
    card_count = Column(Integer, nullable=False)
    layout_json = Column(Text, nullable=False)  # JSON: { type, nodes: [{x,y}], positions: [{label,sublabel,desc}] }
    icon = Column(String(10), default="✨")
    use_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), default="")
    email = Column(String(120), default="")
    phone = Column(String(20), default="")
    message = Column(Text, nullable=False)
    sent = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReportRecord(Base):
    __tablename__ = "report_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # "weekly" or "monthly"
    title = Column(String(200), default="")
    period = Column(String(50), default="")
    content_html = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
