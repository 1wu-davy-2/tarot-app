import { type NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8188";

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, "/api");
  const search = request.nextUrl.search;
  const url = `${BACKEND}${path}${search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!["host", "connection"].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  try {
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

    const res = await fetch(url, {
      method: request.method,
      headers: {
        ...headers,
        "X-Forwarded-Host": request.headers.get("host") || "",
      },
      body,
    });

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      if (!["transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "后端服务不可用" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
