import { NextResponse, type NextRequest } from "next/server";
import { fetchAllContacts } from "@/lib/contacts";
import { buildCsv, buildVcf } from "@/lib/export";
import { fileSlug } from "@/lib/config";
import { json, requireAdmin } from "@/lib/http";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "vcf";
  const verifiedOnly = req.nextUrl.searchParams.get("verifiedOnly") === "1";

  let contacts;
  try {
    contacts = await fetchAllContacts({ verifiedOnly });
  } catch (e) {
    console.error("export error:", e);
    return json({ error: "Could not export contacts." }, 500);
  }

  const body = format === "csv" ? buildCsv(contacts) : buildVcf(contacts);
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileSlug()}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
