// Pure helpers with no imports, so they are easy to test.

/**
 * Accepts 0712345678, 712345678, 254712345678, +254 712 345 678, 0112345678 ...
 * Returns "254XXXXXXXXX" (254 + 9 digits starting with 7 or 1), or null.
 */
export function normalizeKenyanPhone(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith("254")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^[17]\d{8}$/.test(d)) return null;
  return "254" + d;
}

export function formatPhone(p: string): string {
  if (!/^254\d{9}$/.test(p)) return p;
  return `+${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}`;
}

/** Trims, collapses whitespace, strips control / invisible / bidi characters. */
export function cleanName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length >= 2 && s.length <= 50 ? s : null;
}

export function isValidPin(v: unknown): v is string {
  return typeof v === "string" && /^\d{4,6}$/.test(v);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
