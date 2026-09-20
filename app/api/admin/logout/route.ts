import { endSession } from "@/lib/session";
import { json } from "@/lib/http";

export async function POST() {
  await endSession("admin");
  return json({ ok: true });
}
