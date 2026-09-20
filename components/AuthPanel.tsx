"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "register" | "login";

type Props = {
  registrationOpen: boolean;
  full: boolean;
  unavailable: boolean;
  channelUrl: string;
  adminWhatsapp: string;
};

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: res.ok, error: data.error };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

export function AuthPanel({ registrationOpen, full, unavailable, channelUrl, adminWhatsapp }: Props) {
  const router = useRouter();
  const canRegister = registrationOpen && !full && !unavailable;
  const [tab, setTab] = useState<Tab>(canRegister ? "register" : "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [consent, setConsent] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
  }

  async function submit(e: FormEvent, url: string, body: unknown) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await post(url, body);
    if (result.ok) {
      router.push("/account");
      router.refresh();
      return;
    }
    setError(result.error || "Something went wrong. Try again.");
    setBusy(false);
  }

  function onRegister(e: FormEvent) {
    if (!/^\d{4,6}$/.test(pin)) {
      e.preventDefault();
      setError("Your PIN must be 4 to 6 digits.");
      return;
    }
    if (pin !== pin2) {
      e.preventDefault();
      setError("The two PINs don't match.");
      return;
    }
    submit(e, "/api/register", { name, phone, pin, consent });
  }

  function onLogin(e: FormEvent) {
    submit(e, "/api/login", { phone, pin });
  }

  const forgotHref = adminWhatsapp
    ? `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent("Hi, I forgot my PIN. Please reset it.")}`
    : "";

  return (
    <section className="card panel" aria-label="Join or log in">
      <div className="tabs" role="tablist">
        <button role="tab" type="button" className="tab" aria-selected={tab === "register"} onClick={() => switchTab("register")}>
          Join
        </button>
        <button role="tab" type="button" className="tab" aria-selected={tab === "login"} onClick={() => switchTab("login")}>
          Log in
        </button>
      </div>

      {tab === "register" && !canRegister && (
        <div className="stack">
          <p className="msg msg-info">
            {unavailable
              ? "The site is temporarily unavailable. Try again in a few minutes."
              : full
                ? "The list is full. No more spots are available."
                : "Registration is closed right now."}{" "}
            Already joined? Use the Log in tab.
          </p>
          {channelUrl && (
            <a className="btn btn-ghost" href={channelUrl} target="_blank" rel="noopener noreferrer">
              Get updates on WhatsApp
            </a>
          )}
        </div>
      )}

      {tab === "register" && canRegister && (
        <form className="form" onSubmit={onRegister} noValidate>
          <div className="field">
            <label htmlFor="name">Name to save you as</label>
            <input id="name" type="text" autoComplete="name" maxLength={50} required value={name} onChange={(e) => setName(e.target.value)} />
            <span className="hint">Saved exactly as you type it.</span>
          </div>
          <div className="field">
            <label htmlFor="phone">WhatsApp number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="hint">Kenyan number that is on WhatsApp.</span>
          </div>
          <div className="pin-row">
            <div className="field">
              <label htmlFor="pin">Choose a PIN</label>
              <input id="pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="4 to 6 digits" required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="field">
              <label htmlFor="pin2">Repeat PIN</label>
              <input id="pin2" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} required value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <p className="hint">You'll use this PIN to log in and download the file. Don't reuse your phone, bank or M-Pesa PIN.</p>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree that my name and number go into the contact file and will be saved by everyone who downloads it.{" "}
              <a href="/privacy">Read how it works</a>.
            </span>
          </label>
          {error && <p className="msg msg-error" role="alert">{error}</p>}
          <button className="btn btn-block" type="submit" disabled={busy || !consent}>
            {busy ? "Joining..." : "Join the directory"}
          </button>
        </form>
      )}

      {tab === "login" && (
        <form className="form" onSubmit={onLogin} noValidate>
          <div className="field">
            <label htmlFor="login-phone">WhatsApp number</label>
            <input id="login-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-pin">PIN</label>
            <input id="login-pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          </div>
          {error && <p className="msg msg-error" role="alert">{error}</p>}
          <button className="btn btn-block" type="submit" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
          <p className="hint">
            Forgot your PIN?{" "}
            {forgotHref ? (
              <>
                <a href={forgotHref} target="_blank" rel="noopener noreferrer">Message the admin on WhatsApp</a> from the number you registered with.
              </>
            ) : (
              "Message the admin on WhatsApp from the number you registered with."
            )}
          </p>
        </form>
      )}
    </section>
  );
}
