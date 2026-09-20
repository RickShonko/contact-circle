import { db } from "./db";
import { getSession } from "./session";

export type Settings = { capacity: number; registration_open: boolean; file_released: boolean };

export type Contact = {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
  downloaded: boolean;
  downloaded_at: string | null;
  created_at: string;
};

export const CONTACT_COLUMNS = "id, name, phone, verified, downloaded, downloaded_at, created_at";

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db()
    .from("settings")
    .select("capacity, registration_open, file_released")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error(`Could not load settings: ${error?.message}`);
  return data as Settings;
}

export async function countContacts(): Promise<number> {
  const { count, error } = await db().from("contacts").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getStats(): Promise<{ total: number; verified: number; downloaded: number }> {
  const [total, verified, downloaded] = await Promise.all([
    db().from("contacts").select("id", { count: "exact", head: true }),
    db().from("contacts").select("id", { count: "exact", head: true }).eq("verified", true),
    db().from("contacts").select("id", { count: "exact", head: true }).eq("downloaded", true),
  ]);
  return { total: total.count ?? 0, verified: verified.count ?? 0, downloaded: downloaded.count ?? 0 };
}

/** Supabase returns at most 1000 rows per request, so page through them. */
export async function fetchAllContacts(opts: { verifiedOnly?: boolean } = {}): Promise<Contact[]> {
  const PAGE = 1000;
  const all: Contact[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = db()
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (opts.verifiedOnly) q = q.eq("verified", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as Contact[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

/** The logged-in member's own row, or null. */
export async function getCurrentContact(): Promise<Contact | null> {
  const session = await getSession("user");
  if (!session?.phone) return null;
  const { data } = await db().from("contacts").select(CONTACT_COLUMNS).eq("phone", session.phone).maybeSingle();
  return (data as Contact | null) ?? null;
}
