import type { NextRequest } from "next/server";
import { verifySecret } from "@/lib/crypto";
import { allow } from "@/lib/ratelimit";
import { startSession } from "@/lib/session";
import { clientIp, json, readJson } from "@/lib/http";

export async function POST(req: NextRequest) {
  const okIp = await allow(`admin:ip:${clientIp(req)}`, 10, 900);
  const okGlobal = await allow("admin:global", 40, 900);
  if (!okIp || !okGlobal) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);

  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return json({ error: "Admin login is not configured on the server." }, 500);

  const body = await readJson(req);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !(await verifySecret(password, stored))) {
    return json({ error: "Wrong password." }, 401);
  }

  await startSession("admin");
  return json({ ok: true });
}
