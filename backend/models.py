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
    ai_model = Column(String(30), default="deepseek")
    lesson_progress = Column(Text, default="[]")  # JSON array of completed lesson IDs
    mbti_type = Column(String(50), nullable=True, default=None)   # e.g. "INFP|调停者|#d4a853"
    sm_type = Column(String(50), nullable=True, default=None)     # e.g. "Dominant|支配者"
    sm_scores = Column(Text, nullable=True, default=None)         # JSON: [{type,score}]
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


class FortuneCache(Base):
    __tablename__ = "fortune_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zodiac = Column(String(20), nullable=False, index=True)
    period = Column(String(10), nullable=False)  # daily, weekly, monthly, yearly
    date_key = Column(String(10), nullable=False)  # YYYY-MM-DD
    response_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CompatibilityCache(Base):
    __tablename__ = "compatibility_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zodiac_a = Column(String(20), nullable=False, index=True)
    zodiac_b = Column(String(20), nullable=False, index=True)
    date_key = Column(String(10), nullable=False)  # YYYY-MM-DD
    response_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DreamRecord(Base):
    __tablename__ = "dream_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    date = Column(String(10), nullable=False, index=True)
    dream_text = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    moon_phase = Column(String(20), default="")
    mood = Column(Integer, nullable=True)
    tags = Column(String(200), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DailyCardCache(Base):
    __tablename__ = "daily_card_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False, unique=True, index=True)
    card_index = Column(Integer, nullable=False)
    is_reversed = Column(Boolean, default=False)
    sentence = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SmTalkPhrase(Base):
    __tablename__ = "sm_talk_phrases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sm_type = Column(String(20), nullable=False, index=True)  # dominant/submissive/sadist/masochist/switch/vanilla
    category = Column(String(10), nullable=False)  # dirty / sweet
    phrases = Column(Text, nullable=False)  # JSON array of strings
    lang = Column(String(5), default="zh")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
