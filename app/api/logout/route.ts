import { endSession } from "@/lib/session";
import { json } from "@/lib/http";

export async function POST() {
  await endSession("user");
  return json({ ok: true });
}
