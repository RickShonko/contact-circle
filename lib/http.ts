import { NextResponse } from "next/server";
import { getSession } from "./session";

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-vercel-forwarded-for") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Returns an error response if the caller is not a logged-in admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  return (await getSession("admin")) ? null : json({ error: "Not authorized" }, 401);
}
