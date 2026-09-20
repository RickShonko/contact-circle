import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashSecret, pinPepper } from "@/lib/crypto";
import { allow } from "@/lib/ratelimit";
import { startSession } from "@/lib/session";
import { clientIp, json, readJson } from "@/lib/http";
import { cleanName, isValidPin, normalizeKenyanPhone } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // Generous limit: many phones on mobile networks share one IP address.
  if (!(await allow(`register:ip:${clientIp(req)}`, 30, 3600))) {
    return json({ error: "Too many attempts. Try again later." }, 429);
  }

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid request." }, 400);

  const name = cleanName(body.name);
  const phone = normalizeKenyanPhone(typeof body.phone === "string" ? body.phone : "");
  if (!name) return json({ error: "Enter your name (2 to 50 characters)." }, 400);
  if (!phone) return json({ error: "Enter a valid Kenyan WhatsApp number, for example 0712 345 678." }, 400);
  if (!isValidPin(body.pin)) return json({ error: "Your PIN must be 4 to 6 digits." }, 400);
  if (body.consent !== true) {
    return json({ error: "Tick the box to confirm your number can be shared." }, 400);
  }

  const { data, error } = await db().rpc("register_contact", {
    p_name: name,
    p_phone: phone,
    p_pin_hash: await hashSecret(body.pin, pinPepper()),
  });

  if (error) {
    console.error("register error:", error.message);
    return json({ error: "Something went wrong. Try again in a moment." }, 500);
  }

  switch (data) {
    case "closed":
      return json({ error: "Registration is closed." }, 403);
    case "full":
      return json({ error: "The directory is full." }, 409);
    case "duplicate":
      return json({ error: "This number is already registered. Use the Log in tab." }, 409);
    case "ok":
      await startSession("user", phone);
      return json({ ok: true });
    default:
      return json({ error: "Something went wrong. Try again in a moment." }, 500);
  }
}
