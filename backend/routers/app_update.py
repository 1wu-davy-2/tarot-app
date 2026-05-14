"""App version check for APK self-update."""
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["app-update"])

# Bump this on each APK release
CURRENT_VERSION = "1.2.0"
APK_DOWNLOAD_URL = "https://github.com/1wu-davy-2/tarot-app/releases/latest/download/tarot-app.apk"


@router.get("/app-version")
def get_app_version():
    """Return the latest version info so the APK can check for updates."""
    return {
        "version": CURRENT_VERSION,
        "download_url": APK_DOWNLOAD_URL,
        "release_notes": "新版本已发布，建议更新到最新版本以获得更好的体验",
        "min_version": "1.0.0",  # versions below this MUST update
    }
