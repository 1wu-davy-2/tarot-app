#!/bin/bash
# APK build script — handles Next.js 16 static export requirements
# API routes need force-static for export, but that breaks standalone.
# Solution: rename them during export, restore after.
set -e

cd "$(dirname "$0")/.."

cleanup() {
  # Restore any backed-up route files
  for bak in app/api/*/route.ts.bak app/api/*/*/route.ts.bak; do
    [ -f "$bak" ] && mv "$bak" "${bak%.bak}"
  done
}
trap cleanup EXIT

# Backup and replace route handlers with static stubs
for dir in app/api/\[...path\] app/api/daily-reading app/api/interpret; do
  if [ -f "$dir/route.ts" ]; then
    mv "$dir/route.ts" "$dir/route.ts.bak"
    if [[ "$dir" == *"[...path]"* ]]; then
      # Catch-all route needs path array in generateStaticParams
      cat > "$dir/route.ts" << 'STUB_CATCHALL'
export const dynamic = "force-static";
export function generateStaticParams() { return [{ path: ["_"] }]; }
export async function GET() { return new Response(JSON.stringify({ static: true }), { headers: { "Content-Type": "application/json" } }); }
STUB_CATCHALL
    else
      cat > "$dir/route.ts" << 'STUB'
export const dynamic = "force-static";
export function generateStaticParams() { return [{}]; }
export async function GET() { return new Response(JSON.stringify({ static: true }), { headers: { "Content-Type": "application/json" } }); }
STUB
    fi
  fi
done

# Warn if still using default localhost (won't work on real devices)
if [ "${NEXT_PUBLIC_API_URL}" = "http://localhost:8188" ] || [ -z "${NEXT_PUBLIC_API_URL}" ]; then
  echo "⚠  WARNING: NEXT_PUBLIC_API_URL is set to localhost. The APK won't connect to the server on real devices!"
  echo "   Set it to your server IP:"
  echo "   export NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8188"
  echo ""
fi

# Build
BUILD_TARGET=apk NEXT_PUBLIC_BUILD_TARGET=apk NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8188}" npx next build

# Restore happens in cleanup() via trap
