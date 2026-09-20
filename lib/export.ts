// Pure helpers with no imports, so they are easy to test.

// Built at runtime on purpose. If "\r\n" is written as a literal, the production
// minifier can inline it into a template literal, and JavaScript then normalises
// the raw CRLF to a bare LF, which breaks strict vCard parsers.
const CRLF = String.fromCharCode(13, 10);

export function escapeVcf(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** vCard 3.0 is understood by Android, iPhone and Google Contacts. */
export function buildVcf(contacts: { name: string; phone: string }[]): string {
  const cards = contacts.map((c) =>
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:;${escapeVcf(c.name)};;;`,
      `FN:${escapeVcf(c.name)}`,
      `TEL;TYPE=CELL:+${c.phone}`,
      "END:VCARD",
    ].join(CRLF)
  );
  return cards.join(CRLF) + CRLF;
}

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @). */
export function csvCell(v: string): string {
  const s = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(
  rows: { name: string; phone: string; verified: boolean; downloaded: boolean; created_at: string }[]
): string {
  const header = ["name", "phone", "verified", "downloaded", "joined"].join(",");
  const lines = rows.map((r) =>
    [csvCell(r.name), csvCell(r.phone), r.verified ? "yes" : "no", r.downloaded ? "yes" : "no", csvCell(r.created_at)].join(",")
  );
  return [header, ...lines].join(CRLF) + CRLF;
}
