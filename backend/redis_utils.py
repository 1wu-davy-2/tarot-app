"""
Redis-based verification code storage with 5-minute TTL.
Falls back to in-memory dict if Redis is unavailable.
"""
from config import get_settings
import time

settings = get_settings()

# Try to import Redis; degrade gracefully
_redis_client = None
try:
    import redis as redis_lib
    _redis_client = redis_lib.from_url(settings.redis_connection_url, decode_responses=True)
    _redis_client.ping()
except Exception:
    _redis_client = None

# In-memory fallback
_memory_store: dict[str, tuple[str, float]] = {}  # key -> (code, expires_at_ts)

VC_PREFIX = "tarot:vc:"   # Redis key prefix
VC_TTL = 300              # 5 minutes


def save_code(email: str, code: str, code_type: str = "register") -> bool:
    """Store verification code with 5-min expiry. code_type: 'register' | 'reset'"""
    try:
        if _redis_client:
            key = f"{VC_PREFIX}{code_type}:{email}"
            _redis_client.setex(key, VC_TTL, code)
        else:
            key = f"{code_type}:{email}"
            _memory_store[key] = (code, time.time() + VC_TTL)
        return True
    except Exception:
        return False


def verify_code(email: str, code: str, code_type: str = "register") -> bool:
    """Check if code matches and hasn't expired, then delete it."""
    try:
        if _redis_client:
            key = f"{VC_PREFIX}{code_type}:{email}"
            stored = _redis_client.get(key)
            if stored and stored == code:
                _redis_client.delete(key)
                return True
            return False
        else:
            key = f"{code_type}:{email}"
            entry = _memory_store.get(key)
            if not entry:
                return False
            stored_code, expires = entry
            if time.time() > expires:
                del _memory_store[key]
                return False
            if stored_code == code:
                del _memory_store[key]
                return True
            return False
    except Exception:
        return False


def get_dev_code(email: str) -> str | None:
    """Dev helper: peek at a code without consuming it."""
    try:
        if _redis_client:
            key = f"{VC_PREFIX}register:{email}"
            val = _redis_client.get(key)
            if not val:
                key = f"{VC_PREFIX}reset:{email}"
                val = _redis_client.get(key)
            return val
        else:
            for k, (c, exp) in list(_memory_store.items()):
                if email in k and time.time() < exp:
                    return c
        return None
    except Exception:
        return None
