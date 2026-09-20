import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Role = "user" | "admin";
export type Session = { role: Role; phone?: string; exp: number };

// Separate cookies so a user login never overwrites an admin login.
const COOKIE: Record<Role, string> = { user: "vcf_user", admin: "vcf_admin" };
const TTL: Record<Role, number> = { user: 7 * 24 * 3600, admin: 8 * 3600 };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to a random string of 32+ characters");
  return s;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function encode(session: Session): string {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined, role: Role): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (s.role !== role) return null;
    if (typeof s.exp !== "number" || s.exp < Date.now() / 1000) return null;
    if (role === "user" && typeof s.phone !== "string") return null;
    return s;
  } catch {
    return null;
  }
}

export async function startSession(role: Role, phone?: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + TTL[role];
  const jar = await cookies();
  jar.set(COOKIE[role], encode({ role, phone, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL[role],
  });
}

export async function endSession(role: Role): Promise<void> {
  (await cookies()).delete(COOKIE[role]);
}

export async function getSession(role: Role): Promise<Session | null> {
  try {
    const jar = await cookies();
    return decode(jar.get(COOKIE[role])?.value, role);
  } catch (e) {
    console.error("session error:", e);
    return null;
  }
}
