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
    cat > "$dir/route.ts" << 'STUB'
export const dynamic = "force-static";
export function generateStaticParams() { return [{}]; }
export async function GET() { return new Response(JSON.stringify({ static: true }), { headers: { "Content-Type": "application/json" } }); }
STUB
  fi
done

# Build
BUILD_TARGET=apk NEXT_PUBLIC_BUILD_TARGET=apk NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8188}" npx next build

# Restore happens in cleanup() via trap
