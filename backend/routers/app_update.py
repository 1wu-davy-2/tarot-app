"""App version check + APK download for self-update.
APK file served directly so users don't need GitHub access.
Put the APK in /opt/tarot-app/downloads/ (or set APK_FILE_PATH env var).
"""

import os
from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api", tags=["app-update"])

# Bump this on each APK release
CURRENT_VERSION = "1.2.0"

# Where the APK file lives on the server
APK_FILE_PATH = os.environ.get(
    "APK_FILE_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "downloads", "tarot-app.apk"),
)

# Base URL for download. Set APK_DOWNLOAD_HOST to your domain (e.g. "https://tarot.example.com").
# If not set, uses the backend's own /api/app-download endpoint.
APK_DOWNLOAD_HOST = os.environ.get("APK_DOWNLOAD_HOST", "").rstrip("/")


@router.get("/app-version")
def get_app_version():
    """Return latest version info. APK checks this on startup."""
    if APK_DOWNLOAD_HOST:
        download_url = f"{APK_DOWNLOAD_HOST}/api/app-download"
    else:
        download_url = "/api/app-download"

    return {
        "version": CURRENT_VERSION,
        "download_url": download_url,
        "release_notes": "新版本已发布，建议更新到最新版本以获得更好的体验",
        "min_version": "1.0.0",
    }


@router.get("/app-download")
def download_apk():
    """Serve the APK file for download. No auth required."""
    if not os.path.isfile(APK_FILE_PATH):
        return {"error": "APK 文件不存在，请联系管理员"}, 404

    return FileResponse(
        APK_FILE_PATH,
        media_type="application/vnd.android.package-archive",
        filename="tarot-app.apk",
        headers={
            "Content-Disposition": 'attachment; filename="tarot-app.apk"',
            "Cache-Control": "no-cache",
        },
    )
