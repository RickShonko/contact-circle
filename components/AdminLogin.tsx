"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Could not log in.");
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1 className="h2" style={{ marginBottom: 0 }}>Admin login</h1>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="msg msg-error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
