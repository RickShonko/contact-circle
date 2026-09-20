import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchAllContacts, getCurrentContact, getSettings } from "@/lib/contacts";
import { allow } from "@/lib/ratelimit";
import { buildVcf } from "@/lib/export";
import { fileSlug } from "@/lib/config";
import { json } from "@/lib/http";

export async function GET() {
  const me = await getCurrentContact();
  if (!me) return json({ error: "Log in to download the file." }, 401);

  const settings = await getSettings();
  if (!settings.file_released) return json({ error: "The file has not been released yet." }, 403);

  if (!(await allow(`download:${me.id}`, 10, 3600))) {
    return json({ error: "Too many downloads. Try again later." }, 429);
  }

  const contacts = await fetchAllContacts();
  await db()
    .from("contacts")
    .update({ downloaded: true, downloaded_at: new Date().toISOString() })
    .eq("id", me.id);

  return new NextResponse(buildVcf(contacts), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileSlug()}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
