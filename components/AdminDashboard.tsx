"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
  downloaded: boolean;
  created_at: string;
};

type Data = {
  contacts: Row[];
  total: number;
  page: number;
  pageSize: number;
  stats: { total: number; verified: number; downloaded: number };
  settings: { capacity: number; registration_open: boolean; file_released: boolean };
};

type Notice = { kind: "ok" | "error"; text: string; pin?: string };

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string; pin?: string };
  return { ok: res.ok, status: res.status, data };
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [capacity, setCapacity] = useState("");
  const [armed, setArmed] = useState<string | null>(null); // "release" or "delete:<id>"

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPin, setNewPin] = useState("");

  const load = useCallback(async () => {
    const r = await api(`/api/admin/contacts?page=${page}&q=${encodeURIComponent(q)}`, "GET");
    if (r.status === 401) {
      router.refresh();
      return;
    }
    if (!r.ok) {
      setNotice({ kind: "error", text: r.data.error || "Could not load contacts." });
      return;
    }
    const d = r.data as unknown as Data;
    setData(d);
    setCapacity((c) => (c === "" ? String(d.settings.capacity) : c));
  }, [page, q, router]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  function fail(r: { data: { error?: string } }, fallback: string) {
    setNotice({ kind: "error", text: r.data.error || fallback });
  }

  async function patchSettings(patch: Record<string, unknown>, okText: string) {
    const r = await api("/api/admin/settings", "PATCH", patch);
    if (!r.ok) return fail(r, "Could not save settings.");
    setNotice({ kind: "ok", text: okText });
    setArmed(null);
    if ("capacity" in patch) setCapacity(String(patch.capacity));
    load();
  }

  async function addContact(e: FormEvent) {
    e.preventDefault();
    const r = await api("/api/admin/contacts", "POST", { name: newName, phone: newPhone, pin: newPin });
    if (!r.ok) return fail(r, "Could not add the contact.");
    setNotice({
      kind: "ok",
      text: `Added ${newName}.${r.data.pin ? " Their PIN (send it to them on WhatsApp):" : ""}`,
      pin: r.data.pin,
    });
    setNewName("");
    setNewPhone("");
    setNewPin("");
    load();
  }

  async function toggleVerified(row: Row) {
    const r = await api("/api/admin/contacts", "PATCH", { id: row.id, verified: !row.verified });
    if (!r.ok) return fail(r, "Could not update the contact.");
    load();
  }

  async function resetPin(row: Row) {
    const r = await api("/api/admin/contacts", "PATCH", { id: row.id, resetPin: true });
    if (!r.ok) return fail(r, "Could not reset the PIN.");
    setNotice({ kind: "ok", text: `New PIN for ${row.name}. Send it to them on WhatsApp. It won't be shown again:`, pin: r.data.pin });
  }

  async function remove(row: Row) {
    const r = await api(`/api/admin/contacts?id=${row.id}`, "DELETE");
    setArmed(null);
    if (!r.ok) return fail(r, "Could not delete the contact.");
    setNotice({ kind: "ok", text: `Deleted ${row.name}.` });
    load();
  }

  async function logout() {
    await api("/api/admin/logout", "POST");
    router.refresh();
  }

  if (!data) {
    return <p className="muted">{notice ? notice.text : "Loading..."}</p>;
  }

  const { stats, settings } = data;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pct = Math.min(100, Math.round((stats.total / settings.capacity) * 100));

  return (
    <div className="stack" style={{ gap: "1.75rem" }}>
      <div className="row-between">
        <h1 className="h2" style={{ marginBottom: 0 }}>Admin</h1>
        <button type="button" className="btn btn-ghost btn-small" onClick={logout}>Log out</button>
      </div>

      {notice && (
        <div className={`msg ${notice.kind === "ok" ? "msg-ok" : "msg-error"}`} role="status">
          {notice.text}
          {notice.pin && <div className="pin-reveal">{notice.pin}</div>}
        </div>
      )}

      <div className="stats">
        <div className="stat"><b>{stats.total}</b><span>Total contacts</span></div>
        <div className="stat"><b>{stats.verified}</b><span>Verified</span></div>
        <div className="stat"><b>{stats.downloaded}</b><span>Downloaded the file</span></div>
        <div className="stat"><b>{pct}%</b><span>Of {settings.capacity} capacity</span></div>
      </div>

      <section className="plain-card stack" aria-label="Settings">
        <h2 className="h3" style={{ marginBottom: 0 }}>Settings</h2>

        <form className="row" onSubmit={(e) => { e.preventDefault(); patchSettings({ capacity: Number(capacity) }, "Capacity saved."); }}>
          <div className="field" style={{ maxWidth: "11rem" }}>
            <label htmlFor="capacity">Capacity</label>
            <input id="capacity" type="number" min={1} max={100000} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <button className="btn btn-small" type="submit" style={{ alignSelf: "end" }}>Save capacity</button>
        </form>

        <div className="row">
          <span className={`pill ${settings.registration_open ? "pill-open" : "pill-closed"}`} style={{ marginTop: 0 }}>
            Registration {settings.registration_open ? "open" : "closed"}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => patchSettings({ registration_open: !settings.registration_open }, settings.registration_open ? "Registration closed." : "Registration opened.")}
          >
            {settings.registration_open ? "Close registration" : "Open registration"}
          </button>
        </div>

        <div className="row">
          <span className={`pill ${settings.file_released ? "pill-ready" : "pill-closed"}`} style={{ marginTop: 0 }}>
            File {settings.file_released ? "released to members" : "not released"}
          </span>
          {settings.file_released ? (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => patchSettings({ file_released: false }, "File hidden from members.")}>
              Hide file
            </button>
          ) : armed === "release" ? (
            <>
              <button type="button" className="btn btn-danger btn-small" onClick={() => patchSettings({ file_released: true }, "File released. Registration is now closed.")}>
                Confirm: release to all {stats.total} members
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setArmed(null)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn btn-small" onClick={() => setArmed("release")}>
              Release file
            </button>
          )}
        </div>
        <p className="hint">Releasing the file also closes registration, because the list is then final.</p>

        <div className="row">
          <a className="btn btn-ghost btn-small" href="/api/admin/export?format=vcf">Export VCF</a>
          <a className="btn btn-ghost btn-small" href="/api/admin/export?format=vcf&verifiedOnly=1">Export VCF (verified only)</a>
          <a className="btn btn-ghost btn-small" href="/api/admin/export?format=csv">Export CSV</a>
        </div>
      </section>

      <details className="plain-card add">
        <summary>Add a contact by hand</summary>
        <form className="form" onSubmit={addContact}>
          <div className="field">
            <label htmlFor="new-name">Name</label>
            <input id="new-name" type="text" required maxLength={50} value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="new-phone">WhatsApp number</label>
            <input id="new-phone" type="tel" inputMode="tel" placeholder="0712 345 678" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="new-pin">PIN (optional)</label>
            <input id="new-pin" type="text" inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} />
            <span className="hint">Leave blank to generate one. Added contacts ignore capacity and are marked verified.</span>
          </div>
          <button className="btn btn-small" type="submit" style={{ justifySelf: "start" }}>Add contact</button>
        </form>
      </details>

      <section className="stack" aria-label="Contacts">
        <div className="field" style={{ maxWidth: "22rem" }}>
          <label htmlFor="search">Search by name or number</label>
          <input id="search" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>

        <div className="table-wrap">
          {data.contacts.length === 0 ? (
            <p className="empty">{q ? "No contacts match that search." : "No one has joined yet. Share the link to get started."}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>WhatsApp</th>
                  <th>Verified</th>
                  <th>Downloaded</th>
                  <th>Joined</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.contacts.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>+{row.phone}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.verified}
                        onChange={() => toggleVerified(row)}
                        aria-label={`Verified: ${row.name}`}
                        style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--cobalt)" }}
                      />
                    </td>
                    <td>{row.downloaded ? "Yes" : "No"}</td>
                    <td>{new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                    <td className="actions">
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => resetPin(row)}>Reset PIN</button>
                      {armed === `delete:${row.id}` ? (
                        <>
                          <button type="button" className="btn btn-danger btn-small" onClick={() => remove(row)}>Confirm delete</button>
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => setArmed(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => setArmed(`delete:${row.id}`)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="row-between">
          <span className="muted small">Page {data.page} of {pages} ({data.total} shown)</span>
          <div className="row">
            <button type="button" className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button type="button" className="btn btn-ghost btn-small" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
