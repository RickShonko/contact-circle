import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashSecret, pinPepper, verifySecret } from "@/lib/crypto";
import { allow } from "@/lib/ratelimit";
import { startSession } from "@/lib/session";
import { clientIp, json, readJson } from "@/lib/http";
import { isValidPin, normalizeKenyanPhone } from "@/lib/validate";

const INVALID = "Wrong number or PIN.";

// Verified against when the number isn't registered, so response time
// doesn't reveal whether a number exists.
let dummyHash: Promise<string> | null = null;

export async function POST(req: NextRequest) {
  if (!(await allow(`login:ip:${clientIp(req)}`, 30, 900))) {
    return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  const body = await readJson(req);
  const phone = normalizeKenyanPhone(typeof body?.phone === "string" ? body.phone : "");
  if (!body || !phone || !isValidPin(body.pin)) return json({ error: INVALID }, 401);

  // Stops someone guessing PINs for one number.
  if (!(await allow(`login:phone:${phone}`, 5, 900))) {
    return json({ error: "Too many attempts for this number. Try again in 15 minutes." }, 429);
  }

  const { data } = await db().from("contacts").select("pin_hash").eq("phone", phone).maybeSingle();

  dummyHash ??= hashSecret("000000", pinPepper());
  const ok = await verifySecret(body.pin, data?.pin_hash ?? (await dummyHash), pinPepper());
  if (!data || !ok) return json({ error: INVALID }, 401);

  await startSession("user", phone);
  return json({ ok: true });
}
