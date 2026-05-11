import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from routers import auth, checkin, quota, readings
from redis_utils import get_dev_code

settings = get_settings()


def run_migrations():
    """Run Alembic migrations on startup (like Flyway)."""
    try:
        from alembic.config import Config
        from alembic import command
    except ImportError:
        print("[alembic] not installed, using create_all")
        _create_tables_fallback()
        return

    alembic_ini = os.path.join(os.path.dirname(__file__), "alembic.ini")
    if not os.path.exists(alembic_ini):
        print("[alembic] alembic.ini not found, skipping migrations")
        _create_tables_fallback()
        return

    alembic_cfg = Config(alembic_ini)
    db_url_escaped = settings.db_connection_url.replace("%", "%%")
    alembic_cfg.set_main_option("sqlalchemy.url", db_url_escaped)

    try:
        command.upgrade(alembic_cfg, "head")
        print("[alembic] Migrations complete")
    except Exception as e:
        print(f"[alembic] upgrade failed ({e}), falling back to create_all")
        _create_tables_fallback()
        # Stamp head so next startup doesn't try to recreate existing tables
        try:
            command.stamp(alembic_cfg, "head")
            print("[alembic] Stamped head after create_all")
        except Exception:
            pass


def _create_tables_fallback():
    from database import init_db
    init_db()
    print("[alembic] Tables created via create_all")


def ensure_admin():
    """Ensure an admin user exists on startup."""
    from database import SessionLocal
    from models import User
    from auth import hash_password
    db = SessionLocal()
    try:
        admin_email = "admin@tarot-app.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                username="admin",
                email=admin_email,
                phone="",
                password_hash=hash_password("admin@123"),
                is_verified=True,
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("[startup] Admin user created: admin / admin@123")
        else:
            if not admin.is_admin:
                admin.is_admin = True
                db.commit()
                print("[startup] Admin privileges restored")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import engine
    print(f"[startup] DB: {engine.url.get_backend_name()}://{engine.url.host}:{engine.url.port}/{engine.url.database}")
    if settings.email_mode == "smtp":
        print(f"[startup] Email: {settings.smtp_host}:{settings.smtp_port} as {settings.smtp_user}")
    else:
        print("[startup] Email: console mode (no real emails)")
    run_migrations()
    ensure_admin()
    yield


app = FastAPI(title="Tarot App API", version="1.0.0", lifespan=lifespan)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(checkin.router)
app.include_router(quota.router)
app.include_router(readings.router)


# Dev helper: get latest verification code
@app.get("/api/dev/latest-code")
def latest_code(email: str = ""):
    code = get_dev_code(email) if email else ""
    if not code:
        return {"error": "验证码不存在或已过期"}
    return {"email": email, "code": code}


@app.get("/api/health")
def health():
    from database import engine
    return {
        "status": "ok",
        "db_type": engine.url.get_backend_name(),
        "db_host": engine.url.host,
        "db_name": engine.url.database,
        "email_mode": settings.email_mode,
    }


@app.get("/api/debug/users")
def debug_users():
    from database import SessionLocal
    from models import User
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return {
            "count": len(users),
            "users": [{"id": u.id, "username": u.username, "email": u.email, "is_verified": u.is_verified} for u in users],
        }
    finally:
        db.close()
