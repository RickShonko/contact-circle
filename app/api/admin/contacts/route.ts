import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { CONTACT_COLUMNS, getSettings, getStats } from "@/lib/contacts";
import { hashSecret, pinPepper, randomPin } from "@/lib/crypto";
import { json, readJson, requireAdmin } from "@/lib/http";
import { cleanName, isValidPin, normalizeKenyanPhone, UUID_RE } from "@/lib/validate";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = db()
    .from("contacts")
    .select(CONTACT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Keep only letters, digits and spaces so the value can't break the filter syntax.
  let q = (params.get("q") ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim();
  if (/^0\d+$/.test(q)) q = q.slice(1); // 0712... is stored as 254712...
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const [{ data, count, error }, stats, settings] = await Promise.all([query, getStats(), getSettings()]);
  if (error) {
    console.error("admin list error:", error.message);
    return json({ error: "Could not load contacts." }, 500);
  }
  return json({ contacts: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE, stats, settings });
}

/** Add a contact by hand. Ignores capacity and the open/closed switch. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid request." }, 400);

  const name = cleanName(body.name);
  const phone = normalizeKenyanPhone(typeof body.phone === "string" ? body.phone : "");
  if (!name) return json({ error: "Enter a name (2 to 50 characters)." }, 400);
  if (!phone) return json({ error: "Enter a valid Kenyan number." }, 400);

  let pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const generated = pin === "";
  if (generated) pin = randomPin();
  else if (!isValidPin(pin)) return json({ error: "PIN must be 4 to 6 digits, or leave it blank." }, 400);

  const { error } = await db()
    .from("contacts")
    .insert({ name, phone, pin_hash: await hashSecret(pin, pinPepper()), verified: true });

  if (error) {
    if (error.code === "23505") return json({ error: "That number is already in the list." }, 409);
    console.error("admin insert error:", error.message);
    return json({ error: "Could not add the contact." }, 500);
  }
  return json({ ok: true, pin: generated ? pin : undefined });
}

/** Toggle "verified", or reset a member's PIN (for people who forgot theirs). */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson(req);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!body || !UUID_RE.test(id)) return json({ error: "Invalid request." }, 400);

  if (body.resetPin === true) {
    const pin = randomPin();
    const { error } = await db()
      .from("contacts")
      .update({ pin_hash: await hashSecret(pin, pinPepper()) })
      .eq("id", id);
    if (error) return json({ error: "Could not reset the PIN." }, 500);
    return json({ ok: true, pin });
  }

  if (typeof body.verified === "boolean") {
    const { error } = await db().from("contacts").update({ verified: body.verified }).eq("id", id);
    if (error) return json({ error: "Could not update the contact." }, 500);
    return json({ ok: true });
  }

  return json({ error: "Nothing to update." }, 400);
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) return json({ error: "Invalid request." }, 400);

  const { error } = await db().from("contacts").delete().eq("id", id);
  if (error) return json({ error: "Could not delete the contact." }, 500);
  return json({ ok: true });
}
