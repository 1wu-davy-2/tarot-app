"""
Deliver encrypted DeepSeek API key to the frontend.
The frontend decrypts it server-side and calls DeepSeek directly.
"""
import hashlib
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import APIRouter, HTTPException
from config import get_settings

router = APIRouter(prefix="/api", tags=["ai-config"])


def _derive_key(secret: str) -> bytes:
    """Derive a 32-byte AES-256 key from the shared secret."""
    return hashlib.sha256(secret.encode()).digest()


def encrypt_api_key(raw_key: str, secret: str) -> str:
    """AES-256-GCM encrypt the API key. Returns base64(nonce + ciphertext + tag)."""
    key = _derive_key(secret)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, raw_key.encode(), None)  # ct includes 16-byte tag
    return base64.b64encode(nonce + ct).decode()


@router.get("/ai-config")
def ai_config():
    """Return model name and encrypted API key."""
    settings = get_settings()

    if not settings.encryption_key:
        raise HTTPException(status_code=503, detail="AI config encryption not configured")

    if not settings.deepseek_api_key:
        raise HTTPException(status_code=503, detail="DeepSeek API key not configured")

    encrypted = encrypt_api_key(settings.deepseek_api_key, settings.encryption_key)

    return {
        "model": "deepseek-v4-pro",
        "api_key": encrypted,
    }
