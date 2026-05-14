"""Serve alternative deck theme card images.
Images are SVG files stored on the server filesystem.
Route: GET /api/theme-images/{theme}/{filename}
"""

import os
import io
import zipfile
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/theme-images", tags=["theme-images"])

# Configure this path to where theme card images are stored
THEMES_DIR = os.path.abspath(os.environ.get("THEMES_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "theme-cards")))

ALLOWED_THEMES = {"marseille", "modern-minimal"}
MEMBER_THEMES = {"marseille", "modern-minimal"}


def check_theme_access(user: User):
    """Raise 403 if user is not basic+ member."""
    if user.is_admin:
        return
    tier = (user.membership_tier or "free").lower()
    if tier == "free":
        from datetime import datetime
        if user.membership_expiry and user.membership_expiry > datetime.utcnow():
            return
        raise HTTPException(status_code=403, detail="需要基础会员以上才能使用主题牌面")


@router.get("/{theme}/{filename}")
def serve_theme_image(
    theme: str,
    filename: str,
):
    """Serve a single theme card image (SVG). No auth needed — access gated by UI."""
    if theme not in ALLOWED_THEMES:
        raise HTTPException(status_code=404, detail="主题不存在")

    # Security: prevent path traversal
    safe_name = os.path.basename(filename)
    if ".." in safe_name or "/" in safe_name or "\\" in safe_name:
        raise HTTPException(status_code=400, detail="无效文件名")

    filepath = os.path.join(THEMES_DIR, theme, safe_name)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="图片不存在")

    return FileResponse(
        filepath,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/{theme}/preview")
def serve_preview(theme: str):
    """Serve a preview/thumbnail for the theme (the Fool card). No auth needed."""
    if theme not in ALLOWED_THEMES:
        raise HTTPException(status_code=404, detail="主题不存在")

    safe_name = "00-fool.svg"
    filepath = os.path.join(THEMES_DIR, theme, safe_name)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="预览不可用")

    return FileResponse(
        filepath,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/{theme}/download")
def download_theme_pack(
    theme: str,
    user: User = Depends(get_current_user),
):
    """Download all cards for a theme as a ZIP file (for APK offline use)."""
    if theme not in ALLOWED_THEMES:
        raise HTTPException(status_code=404, detail="主题不存在")

    if theme in MEMBER_THEMES:
        check_theme_access(user)

    theme_dir = os.path.join(THEMES_DIR, theme)
    if not os.path.isdir(theme_dir):
        raise HTTPException(status_code=404, detail="主题数据不存在")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in sorted(os.listdir(theme_dir)):
            if fname.endswith(".svg"):
                fpath = os.path.join(theme_dir, fname)
                zf.write(fpath, f"{theme}/{fname}")

    buf.seek(0)
    return Response(
        buf.read(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{theme}-cards.zip"',
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/manifest")
def theme_manifest():
    """Return list of available themes with metadata."""
    themes = [
        {
            "id": "rider-waite",
            "name": "经典韦特",
            "description": "Rider-Waite-Smith 经典牌面",
            "icon": "🃏",
            "premiumOnly": False,
            "default": True,
        },
        {
            "id": "marseille",
            "name": "马赛风格",
            "description": "法式经典马赛塔罗牌 · 会员专属",
            "icon": "🎴",
            "premiumOnly": True,
            "default": False,
        },
        {
            "id": "modern-minimal",
            "name": "现代极简",
            "description": "简约几何现代风格 · 会员专属",
            "icon": "✨",
            "premiumOnly": True,
            "default": False,
        },
    ]
    return themes
