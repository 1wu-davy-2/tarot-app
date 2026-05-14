#!/bin/bash
# Build two APKs: root (v1.2.1) and downloads (v1.2.2) — both with correct server URL
set -e
cd "$(dirname "$0")/.."

SERVER_URL="${NEXT_PUBLIC_API_URL:-http://14.103.242.161:8188}"
echo "Server URL: $SERVER_URL"

# ── Build v1.2.1 (root) ──
echo "=== Building v1.2.1 (root) ==="
# Temporarily set version to 1.2.1 in AppUpdateBanner
sed -i 's/const APP_VERSION = "1.2.2"/const APP_VERSION = "1.2.1"/' components/AppUpdateBanner.tsx

bash scripts/apk-build.sh

npx cap sync android
echo "sdk.dir=C:/Users/zmops/AppData/Local/Android/Sdk" > android/local.properties
export ANDROID_HOME="C:/Users/zmops/AppData/Local/Android/Sdk"
cd android && ./gradlew assembleDebug && cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk tarot-app-debug.apk
echo "v1.2.1 → tarot-app-debug.apk"

# ── Build v1.2.2 (downloads) ──
echo "=== Building v1.2.2 (downloads) ==="
sed -i 's/const APP_VERSION = "1.2.1"/const APP_VERSION = "1.2.2"/' components/AppUpdateBanner.tsx

bash scripts/apk-build.sh

npx cap sync android
echo "sdk.dir=C:/Users/zmops/AppData/Local/Android/Sdk" > android/local.properties
cd android && ./gradlew assembleDebug && cd ..
mkdir -p downloads
cp android/app/build/outputs/apk/debug/app-debug.apk downloads/tarot-app.apk
echo "v1.2.2 → downloads/tarot-app.apk"

echo "Done. Both APKs built with $SERVER_URL"
