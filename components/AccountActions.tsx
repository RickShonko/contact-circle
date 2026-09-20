"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActions({ canRemove }: { canRemove: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/me", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error || "Could not remove your number.");
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
        {canRemove && !confirming && (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
            Remove my number
          </button>
        )}
      </div>
      {confirming && (
        <div className="msg msg-error" role="alert">
          <p>
            <strong>Remove your number from the list?</strong> You'll need to join again if you change your mind, and the list may be full by then.
          </p>
          <div className="row" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn btn-danger btn-small" onClick={remove} disabled={busy}>
              {busy ? "Removing..." : "Yes, remove it"}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </button>
          </div>
        </div>
      )}
      {error && <p className="msg msg-error" role="alert">{error}</p>}
    </div>
  );
}
