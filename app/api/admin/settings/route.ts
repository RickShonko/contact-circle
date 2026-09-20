import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { Settings } from "@/lib/contacts";
import { json, readJson, requireAdmin } from "@/lib/http";

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid request." }, 400);

  const patch: Partial<Settings> = {};

  if ("capacity" in body) {
    const n = Number(body.capacity);
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      return json({ error: "Capacity must be a whole number between 1 and 100,000." }, 400);
    }
    patch.capacity = n;
  }
  if (typeof body.registration_open === "boolean") patch.registration_open = body.registration_open;
  if (typeof body.file_released === "boolean") {
    patch.file_released = body.file_released;
    if (body.file_released) patch.registration_open = false; // the list is final once released
  }

  if (Object.keys(patch).length === 0) return json({ error: "Nothing to update." }, 400);

  const { error } = await db().from("settings").update(patch).eq("id", 1);
  if (error) {
    console.error("settings error:", error.message);
    return json({ error: "Could not save settings." }, 500);
  }
  return json({ ok: true });
}
