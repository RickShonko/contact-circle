import { db } from "@/lib/db";
import { getCurrentContact, getSettings } from "@/lib/contacts";
import { endSession } from "@/lib/session";
import { json } from "@/lib/http";

/** Lets a member remove themselves, but only before the file is released. */
export async function DELETE() {
  const me = await getCurrentContact();
  if (!me) return json({ error: "Log in first." }, 401);

  const settings = await getSettings();
  if (settings.file_released) {
    return json(
      { error: "The file has already been released, so your number can't be taken back from it." },
      409
    );
  }

  const { error } = await db().from("contacts").delete().eq("id", me.id);
  if (error) {
    console.error("delete error:", error.message);
    return json({ error: "Could not remove your number. Try again." }, 500);
  }
  await endSession("user");
  return json({ ok: true });
}
